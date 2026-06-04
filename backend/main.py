import os
import base64
import random
import string
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from database import Base, engine, get_db
from models import Product, Order, User, OtpCode
from auth import hash_password, verify_password, create_token, get_current_user, get_current_user_optional, require_admin, require_delivery

Base.metadata.create_all(bind=engine)

# ── Safe additive migrations ───────────────────────────────────────────────────
with engine.connect() as _conn:
    _conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_delivery BOOLEAN DEFAULT false"))
    _conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)"))
    _conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'pending'"))
    _conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR DEFAULT 'delivery'"))
    _conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS address VARCHAR"))
    _conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_code VARCHAR"))
    _conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS description VARCHAR"))
    _conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS image_data TEXT"))
    _conn.execute(text("""
        CREATE TABLE IF NOT EXISTS otp_codes (
            id SERIAL PRIMARY KEY,
            phone VARCHAR NOT NULL,
            code VARCHAR NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            used BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """))
    _conn.commit()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ────────────────────────────────────────────────────────────────────

class AdminSignup(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: str
    password: str

class Login(BaseModel):
    email: str
    password: str

class OrderCreate(BaseModel):
    customer_name: str
    phone: str
    address: Optional[str] = None
    order_type: str = "delivery"
    items: str
    total: float

class OrderStatusUpdate(BaseModel):
    status: str

class ProductCreate(BaseModel):
    name: str
    price: float
    emoji: str = "🍰"
    description: Optional[str] = None
    available: bool = True

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    emoji: Optional[str] = None
    description: Optional[str] = None
    available: Optional[bool] = None

class SendOtp(BaseModel):
    phone: str

class VerifyOtp(BaseModel):
    phone: str
    code: str


# ── Helpers ────────────────────────────────────────────────────────────────────

def user_response(user, token):
    return {"token": token, "email": user.email, "is_admin": user.is_admin, "is_delivery": user.is_delivery}

def generate_order_code() -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def product_dict(p: Product) -> dict:
    return {
        "id": p.id, "name": p.name, "price": str(p.price),
        "emoji": p.emoji, "description": p.description,
        "image_data": p.image_data, "available": p.available,
    }

def send_sms(to: str, body: str):
    """Send SMS via Twilio if TWILIO_ACCOUNT_SID env var is set. Silent no-op otherwise."""
    sid = os.getenv("TWILIO_ACCOUNT_SID")
    if not sid:
        return
    try:
        from twilio.rest import Client
        Client(sid, os.getenv("TWILIO_AUTH_TOKEN")).messages.create(
            body=body,
            from_=os.getenv("TWILIO_FROM_NUMBER"),
            to=to,
        )
    except Exception:
        pass


# ── OTP ────────────────────────────────────────────────────────────────────────

@app.post("/api/otp/send")
def otp_send(data: SendOtp, db: Session = Depends(get_db)):
    phone = data.phone.strip()
    if len(phone) < 6:
        raise HTTPException(status_code=400, detail="Invalid phone number")

    # Remove old codes for this phone
    db.query(OtpCode).filter(OtpCode.phone == phone).delete()
    code = ''.join(random.choices(string.digits, k=4))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    db.add(OtpCode(phone=phone, code=code, expires_at=expires_at))
    db.commit()

    send_sms(phone, f"Your საკონდიტრო order code: {code}. Valid for 5 minutes.")
    return {"message": "Code sent"}

@app.post("/api/otp/verify")
def otp_verify(data: VerifyOtp, db: Session = Depends(get_db)):
    phone = data.phone.strip()
    code = data.code.strip()
    otp = db.query(OtpCode).filter(
        OtpCode.phone == phone,
        OtpCode.code == code,
        OtpCode.used == False,
    ).first()
    if not otp:
        raise HTTPException(status_code=400, detail="Wrong code. Please try again.")
    if otp.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Code expired. Request a new one.")
    otp.used = True
    db.commit()
    return {"verified": True}


# ── Auth ───────────────────────────────────────────────────────────────────────

@app.post("/api/auth/register")
def register(data: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=data.email, password=hash_password(data.password))
    db.add(user); db.commit(); db.refresh(user)
    return user_response(user, create_token(user.id))

@app.post("/api/auth/admin/signup")
def admin_signup(data: AdminSignup, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=data.email, password=hash_password(data.password), is_admin=True)
    db.add(user); db.commit()
    return {"message": "Admin account created"}

@app.post("/api/auth/delivery/signup", dependencies=[Depends(require_admin)])
def delivery_signup(data: AdminSignup, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=data.email, password=hash_password(data.password), is_delivery=True)
    db.add(user); db.commit()
    return {"message": "Delivery account created"}

@app.post("/api/auth/login")
def login(data: Login, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return user_response(user, create_token(user.id))


# ── Public ─────────────────────────────────────────────────────────────────────

@app.get("/api/products")
def get_products(db: Session = Depends(get_db)):
    return [product_dict(p) for p in db.query(Product).filter(Product.available == True).all()]

@app.post("/api/orders")
def create_order(order: OrderCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user_optional)):
    code = generate_order_code()
    db_order = Order(**order.model_dump(), user_id=current_user.id if current_user else None, order_code=code)
    db.add(db_order); db.commit(); db.refresh(db_order)
    return {"message": "Order placed!", "id": db_order.id, "order_code": code}

@app.get("/api/orders/my")
def my_orders(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return [
        {"id": o.id, "items": o.items, "total": str(o.total), "status": o.status,
         "order_type": o.order_type, "order_code": o.order_code, "address": o.address,
         "created_at": o.created_at.isoformat() if o.created_at else None}
        for o in db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()
    ]

@app.get("/api/health")
def health():
    return {"status": "ok"}


# ── Delivery ───────────────────────────────────────────────────────────────────

@app.get("/api/delivery/orders")
def delivery_orders(db: Session = Depends(get_db), user=Depends(require_delivery)):
    return [
        {"id": o.id, "customer_name": o.customer_name, "phone": o.phone, "address": o.address,
         "items": o.items, "total": str(o.total), "status": o.status, "order_type": o.order_type,
         "order_code": o.order_code, "created_at": o.created_at.isoformat() if o.created_at else None}
        for o in db.query(Order).filter(Order.order_type == "delivery").order_by(Order.created_at.desc()).all()
    ]

@app.put("/api/delivery/orders/{order_id}/status")
def delivery_update_status(order_id: int, data: OrderStatusUpdate, db: Session = Depends(get_db), user=Depends(require_delivery)):
    if data.status not in ["out_for_delivery", "delivered"]:
        raise HTTPException(status_code=400, detail="Invalid status for delivery")
    order = db.query(Order).filter(Order.id == order_id, Order.order_type == "delivery").first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = data.status
    db.commit()
    return {"message": "Status updated"}


# ── Admin: Products ────────────────────────────────────────────────────────────

@app.get("/api/admin/products", dependencies=[Depends(require_admin)])
def admin_get_products(db: Session = Depends(get_db)):
    return [product_dict(p) for p in db.query(Product).all()]

@app.post("/api/admin/products", dependencies=[Depends(require_admin)])
def admin_create_product(product: ProductCreate, db: Session = Depends(get_db)):
    db_product = Product(**product.model_dump())
    db.add(db_product); db.commit(); db.refresh(db_product)
    return product_dict(db_product)

@app.put("/api/admin/products/{product_id}", dependencies=[Depends(require_admin)])
def admin_update_product(product_id: int, data: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(product, k, v)
    db.commit(); db.refresh(product)
    return product_dict(product)

@app.post("/api/admin/products/{product_id}/image")
async def upload_product_image(product_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    contents = await file.read()
    if len(contents) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large. Max 8 MB.")
    mime = file.content_type or "image/jpeg"
    product.image_data = f"data:{mime};base64,{base64.b64encode(contents).decode()}"
    db.commit()
    return {"message": "Image uploaded", "id": product.id}

@app.delete("/api/admin/products/{product_id}/image", dependencies=[Depends(require_admin)])
def remove_product_image(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.image_data = None; db.commit()
    return {"message": "Image removed"}

@app.delete("/api/admin/products/{product_id}", dependencies=[Depends(require_admin)])
def admin_delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product); db.commit()
    return {"message": "Product deleted"}


# ── Admin: Orders ──────────────────────────────────────────────────────────────

@app.get("/api/admin/orders", dependencies=[Depends(require_admin)])
def admin_get_orders(db: Session = Depends(get_db)):
    return [
        {"id": o.id, "customer_name": o.customer_name, "phone": o.phone, "address": o.address,
         "items": o.items, "total": str(o.total), "status": o.status, "order_type": o.order_type,
         "order_code": o.order_code, "created_at": o.created_at.isoformat() if o.created_at else None}
        for o in db.query(Order).order_by(Order.created_at.desc()).all()
    ]

@app.put("/api/admin/orders/{order_id}/status", dependencies=[Depends(require_admin)])
def admin_update_order_status(order_id: int, data: OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = data.status; db.commit()
    return {"message": "Status updated"}


# ── Admin: Team ────────────────────────────────────────────────────────────────

@app.get("/api/admin/team", dependencies=[Depends(require_admin)])
def admin_get_team(db: Session = Depends(get_db)):
    return [{"id": u.id, "email": u.email, "created_at": u.created_at}
            for u in db.query(User).filter(User.is_delivery == True).all()]
