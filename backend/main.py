import os
import base64
import random
import string
import logging
import resend
import httpx
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, Field, field_validator
from typing import Literal, Optional
from database import Base, engine, get_db
from models import (
    AppLog,
    LockerSurveyResponse,
    Order,
    OtpCode,
    Product,
    ShopSettings,
    User,
)
from auth import hash_password, verify_password, create_token, get_current_user, get_current_user_optional, require_admin, require_delivery

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sakonditro")

Base.metadata.create_all(bind=engine)

# ── Safe additive migrations ───────────────────────────────────────────────────
with engine.connect() as _conn:
    _conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_delivery BOOLEAN DEFAULT false"))
    _conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)"))
    _conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'pending'"))
    _conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR DEFAULT 'delivery'"))
    _conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS address VARCHAR"))
    _conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_code VARCHAR"))
    _conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR"))
    _conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS description VARCHAR"))
    _conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS image_data TEXT"))
    _conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price NUMERIC"))
    _conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR"))
    _conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token VARCHAR"))
    _conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_photo_data TEXT"))
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
    _conn.execute(text("""
        CREATE TABLE IF NOT EXISTS shop_settings (
            id SERIAL PRIMARY KEY,
            shop_name VARCHAR,
            phone VARCHAR,
            address VARCHAR,
            pickup_note VARCHAR,
            weekdays_open VARCHAR,
            weekdays_close VARCHAR,
            saturday_open VARCHAR,
            saturday_close VARCHAR,
            sunday_open VARCHAR,
            sunday_close VARCHAR,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """))
    _conn.execute(text("""
        CREATE TABLE IF NOT EXISTS app_logs (
            id SERIAL PRIMARY KEY,
            level VARCHAR NOT NULL,
            message TEXT NOT NULL,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            source VARCHAR
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

class AdminSetupSignup(BaseModel):
    email: str
    password: str
    setup_secret: str

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
    customer_email: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: str

class ProductCreate(BaseModel):
    name: str
    price: float
    emoji: str = "🍰"
    description: Optional[str] = None
    sale_price: Optional[float] = None
    category: Optional[str] = None
    available: bool = True

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    emoji: Optional[str] = None
    description: Optional[str] = None
    sale_price: Optional[float] = None
    category: Optional[str] = None
    available: Optional[bool] = None

class SendOtp(BaseModel):
    email: str

class VerifyOtp(BaseModel):
    email: str
    code: str

class PushTokenUpdate(BaseModel):
    push_token: str

class ShopSettingsUpdate(BaseModel):
    shop_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    pickup_note: Optional[str] = None
    weekdays_open: Optional[str] = None
    weekdays_close: Optional[str] = None
    saturday_open: Optional[str] = None
    saturday_close: Optional[str] = None
    sunday_open: Optional[str] = None
    sunday_close: Optional[str] = None


class LockerSurveyAnswers(BaseModel):
    q1: str = Field(min_length=1, max_length=2000)
    q2: Literal["დიახ", "არა"]
    q3: int = Field(ge=1, le=5)
    q4: list[
        Literal["წიგნები", "სპორტული ნივთები", "ტანსაცმელი", "სასკოლო ნივთები", "სხვა"]
    ] = Field(min_length=1)
    q5: Literal["ლითონის", "ხის", "პლასტმასის", "მნიშვნელობა არ აქვს"]
    q6: Literal["სკოლაში", "სპორტულ დარბაზში", "სახლში", "სხვა"]
    q7: Literal["სამნიშნა მბრუნავი კოდი", "ოთხნიშნა მბრუნავი კოდი", "ღილაკებიანი მექანიკური საკეტი"]
    q8: Literal["თვეში ერთხელ", "რამდენიმე თვეში ერთხელ", "მხოლოდ საჭიროებისას", "არასდროს"]
    q9: Literal["მარტივად", "საშუალოდ", "რთულად"]
    q10: Literal["დიახ", "არა", "არ ვიცი"]

    @field_validator("q1")
    @classmethod
    def trim_open_answer(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("პირველ კითხვაზე პასუხი სავალდებულოა")
        return cleaned


class LockerSurveySubmission(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    answers: LockerSurveyAnswers

    @field_validator("first_name", "last_name")
    @classmethod
    def trim_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("სახელი და გვარი სავალდებულოა")
        return cleaned


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
        "sale_price": str(p.sale_price) if p.sale_price else None,
        "category": p.category,
    }

def send_email_otp(to_email: str, code: str) -> bool:
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        return False
    try:
        resend.api_key = api_key
        resend.Emails.send({  
            "from": "tamuna@tamaracook.ink",
            "to": to_email,
            "subject": f"Your verification code: {code}",
            "html": f"""
        <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:24px">
          <h2 style="color:#d4235e;margin-bottom:4px">საკონდიტრო</h2>
          <p style="color:#8b6070;font-size:14px">Your order verification code</p>
          <div style="font-size:36px;font-weight:900;letter-spacing:0.3em;color:#1c0f18;
                      background:#fdf6f2;padding:20px;border-radius:14px;text-align:center;
                      border:1px solid #f0e4ea;margin:20px 0">{code}</div>
          <p style="color:#8b6070;font-size:13px">Valid for 5 minutes. Do not share this code.</p>
        </div>""",
        })
        return True
    except Exception:
        logger.exception(f"Failed to send OTP email to {to_email}")
        return False


def send_order_email(to_email: str, customer_name: str, order_code: str, email_type: str, items: str = "", total: str = ""):
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key or not to_email:
        return
    CONTENT = {
        "placed":           ("🍰", "#d4235e", "Order Received!",      f"Hi {customer_name}! Your order has been received and we'll start preparing it very soon.", "You'll get updates here as your order progresses. 🎉"),
        "confirmed":        ("✅", "#16a34a", "Order Confirmed!",      f"Hi {customer_name}! Great news — your order is confirmed and our bakers are working on it right now.", "We'll let you know as soon as it's on the way."),
        "out_for_delivery": ("🚚", "#7c3aed", "On Its Way!",           f"Hi {customer_name}! Your order has been picked up and is heading to you right now.", "Please be ready to receive it. Almost there!"),
        "delivered":        ("💕", "#059669", "Delivered!",            f"Hi {customer_name}! Your order has been delivered. We hope you enjoy every single bite!", "Thank you so much for choosing საკონდიტრო. Come back soon! 🍰"),
        "ready":            ("🏠", "#d4235e", "Ready for Pickup!",     f"Hi {customer_name}! Your order is freshly made and ready to be picked up.", "Please come collect it at our kitchen whenever you're ready."),
        "cancelled":        ("😔", "#6b7280", "Order Cancelled",       f"Hi {customer_name}, we're sorry to let you know that your order has been cancelled.", "Please contact us if you have any questions or need help with a new order."),
    }
    if email_type not in CONTENT:
        return
    icon, color, headline, body, sub = CONTENT[email_type]
    items_html = f'<p style="color:#6b4c58;font-size:14px;margin:6px 0 0;line-height:1.5">{items}</p>' if items else ""
    total_html = f'<p style="color:#d4235e;font-weight:700;font-size:17px;margin:10px 0 0">Total: ₾{total}</p>' if total else ""
    html = f"""
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#1c0f18 0%,#3a1430 100%);padding:28px 32px;text-align:center">
        <div style="font-size:2.5rem;margin-bottom:8px">{icon}</div>
        <h1 style="color:white;font-size:20px;margin:0 0 4px;letter-spacing:0.02em">საკონდიტრო</h1>
        <p style="color:rgba(255,255,255,0.4);font-size:11px;margin:0;letter-spacing:0.12em;text-transform:uppercase">Georgian Confectionery</p>
      </div>
      <div style="padding:32px">
        <h2 style="color:{color};font-size:24px;margin:0 0 14px;font-weight:700">{headline}</h2>
        <p style="color:#1c0f18;font-size:15px;line-height:1.65;margin:0 0 6px">{body}</p>
        <p style="color:#8b6070;font-size:13px;line-height:1.6;margin:0 0 24px">{sub}</p>
        <div style="background:#fdf6f2;border:1px solid #f0e4ea;border-radius:14px;padding:20px">
          <p style="color:#8b6070;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 6px;font-weight:600">Your Order Code</p>
          <p style="font-family:monospace;font-size:30px;font-weight:900;color:#1c0f18;letter-spacing:0.22em;margin:0 0 10px">{order_code}</p>
          {items_html}
          {total_html}
        </div>
      </div>
      <div style="background:#fdf6f2;padding:18px 32px;border-top:1px solid #f0eaf4;text-align:center">
        <p style="color:#b09aaa;font-size:12px;margin:0">Made with ❤️ &nbsp;·&nbsp; საკონდიტრო</p>
      </div>
    </div>"""
    try:
        resend.api_key = api_key
        resend.Emails.send({
            "from": "tamuna@tamaracook.ink",
            "to": to_email,
            "subject": f"Order {order_code} — საკონდიტრო",
            "html": html,
        })
    except Exception:
        logger.exception(f"Failed to send order email ({email_type}) to {to_email} for order {order_code}")


def send_push(token: str, title: str, body: str, data: dict = None):
    if not token:
        return
    try:
        httpx.post(
            "https://exp.host/--/api/v2/push/send",
            json={"to": token, "title": title, "body": body, "data": data or {}},
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            timeout=10,
        )
    except Exception:
        logger.exception("Failed to send push notification")


def notify_role_push(db: Session, role_column: str, title: str, body: str, data: dict = None):
    users = db.query(User).filter(getattr(User, role_column) == True, User.push_token.isnot(None)).all()
    for u in users:
        send_push(u.push_token, title, body, data)


STATUS_PUSH_TEXT = {
    "confirmed":        ("Order Confirmed! ✅", "Your order is confirmed and being prepared."),
    "out_for_delivery": ("On Its Way! 🚚", "Your order has been picked up and is heading to you."),
    "ready":            ("Ready for Pickup! 🏠", "Your order is ready to be picked up."),
    "delivered":        ("Delivered! 💕", "Your order has been delivered. Enjoy!"),
    "cancelled":        ("Order Cancelled 😔", "Your order has been cancelled."),
}

def notify_customer_status(db: Session, order: Order, status: str):
    if not order.user_id or status not in STATUS_PUSH_TEXT:
        return
    user = db.query(User).filter(User.id == order.user_id).first()
    if not user or not user.push_token:
        return
    title, body = STATUS_PUSH_TEXT[status]
    send_push(user.push_token, title, body, {"order_id": order.id, "order_code": order.order_code})


# ── OTP ────────────────────────────────────────────────────────────────────────

@app.post("/api/otp/send")
def otp_send(data: SendOtp, db: Session = Depends(get_db)):
    email = data.email.strip().lower()
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")
    db.query(OtpCode).filter(OtpCode.phone == email).delete()
    code = ''.join(random.choices(string.digits, k=6))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    db.add(OtpCode(phone=email, code=code, expires_at=expires_at))
    db.commit()
    sent = send_email_otp(email, code)
    if not sent:
        return {"message": "Code generated (email not configured)", "dev_code": code}
    return {"message": "Code sent"}

@app.post("/api/otp/verify")
def otp_verify(data: VerifyOtp, db: Session = Depends(get_db)):
    email = data.email.strip().lower()
    code = data.code.strip()
    otp = db.query(OtpCode).filter(
        OtpCode.phone == email,
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
def admin_signup(data: AdminSetupSignup, db: Session = Depends(get_db)):
    setup_secret = os.getenv("ADMIN_SETUP_SECRET")
    if not setup_secret or data.setup_secret != setup_secret:
        raise HTTPException(status_code=403, detail="Invalid setup secret")
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

@app.post("/api/me/push-token")
def update_push_token(data: PushTokenUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.push_token = data.push_token
    db.commit()
    return {"message": "Push token saved"}


# ── Public ─────────────────────────────────────────────────────────────────────

@app.get("/api/products")
def get_products(db: Session = Depends(get_db)):
    return [product_dict(p) for p in db.query(Product).filter(Product.available == True).all()]

@app.post("/api/orders")
def create_order(order: OrderCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user_optional)):
    code = generate_order_code()
    db_order = Order(**order.model_dump(), user_id=current_user.id if current_user else None, order_code=code)
    db.add(db_order); db.commit(); db.refresh(db_order)
    send_order_email(
        order.customer_email or "",
        order.customer_name,
        code,
        "placed",
        order.items,
        str(order.total),
    )
    notify_role_push(
        db, "is_admin", "New Order! 🍰",
        f"{order.customer_name} placed an order for ₾{order.total}",
        {"order_id": db_order.id, "order_code": code},
    )
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

@app.post("/api/locker-survey-responses", status_code=201)
def create_locker_survey_response(
    payload: LockerSurveySubmission,
    db: Session = Depends(get_db),
):
    response = LockerSurveyResponse(
        first_name=payload.first_name,
        last_name=payload.last_name,
        answers_json=payload.answers.model_dump_json(),
    )
    db.add(response)
    db.commit()
    db.refresh(response)
    return {"id": response.id, "message": "პასუხი წარმატებით შეინახა"}

@app.get("/api/settings")
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(ShopSettings).first()
    if not settings:
        return {}
    return {
        "shop_name": settings.shop_name, "phone": settings.phone,
        "address": settings.address, "pickup_note": settings.pickup_note,
        "weekdays_open": settings.weekdays_open, "weekdays_close": settings.weekdays_close,
        "saturday_open": settings.saturday_open, "saturday_close": settings.saturday_close,
        "sunday_open": settings.sunday_open, "sunday_close": settings.sunday_close,
    }

@app.put("/api/settings", dependencies=[Depends(require_admin)])
def update_settings(data: ShopSettingsUpdate, db: Session = Depends(get_db)):
    settings = db.query(ShopSettings).first()
    if not settings:
        settings = ShopSettings()
        db.add(settings)
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(settings, k, v)
    db.commit()
    return {"message": "Settings updated"}


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
    notify_customer_status(db, order, data.status)
    return {"message": "Status updated"}

@app.post("/api/delivery/orders/{order_id}/photo")
async def upload_delivery_photo(order_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(require_delivery)):
    order = db.query(Order).filter(Order.id == order_id, Order.order_type == "delivery").first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    contents = await file.read()
    if len(contents) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large. Max 8 MB.")
    mime = file.content_type or "image/jpeg"
    order.delivery_photo_data = f"data:{mime};base64,{base64.b64encode(contents).decode()}"
    db.commit()
    return {"message": "Photo uploaded", "id": order.id}


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
         "order_code": o.order_code, "customer_email": o.customer_email,
         "created_at": o.created_at.isoformat() if o.created_at else None}
        for o in db.query(Order).order_by(Order.created_at.desc()).all()
    ]

@app.put("/api/admin/orders/{order_id}/status", dependencies=[Depends(require_admin)])
def admin_update_order_status(order_id: int, data: OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = data.status
    db.commit()
    send_order_email(
        order.customer_email or "",
        order.customer_name,
        order.order_code or f"#{order.id}",
        data.status,
        order.items,
        str(order.total),
    )
    notify_customer_status(db, order, data.status)
    if data.status == "confirmed" and order.order_type == "delivery":
        notify_role_push(
            db, "is_delivery", "New Delivery Ready! 🚚",
            f"Order #{order.order_code} is ready for pickup",
            {"order_id": order.id, "order_code": order.order_code},
        )
    return {"message": "Status updated"}

@app.delete("/api/admin/orders/{order_id}", dependencies=[Depends(require_admin)])
def admin_delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(order); db.commit()
    return {"message": "Order deleted"}


# ── Admin: Team ────────────────────────────────────────────────────────────────

@app.get("/api/admin/team", dependencies=[Depends(require_admin)])
def admin_get_team(db: Session = Depends(get_db)):
    return [{"id": u.id, "email": u.email, "created_at": u.created_at}
            for u in db.query(User).filter(User.is_delivery == True).all()]


# ── Logging ────────────────────────────────────────────────────────────────────

class LogEntry(BaseModel):
    level: str  # 'log', 'error', 'warn', 'info'
    message: str
    source: Optional[str] = None  # 'web', 'mobile'


@app.post("/api/logs")
def save_log(log: LogEntry, db: Session = Depends(get_db)):
    """Save a log entry to the database"""
    try:
        db_log = AppLog(
            level=log.level,
            message=log.message,
            source=log.source or "unknown"
        )
        db.add(db_log)
        db.commit()
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Failed to save log: {str(e)}")
        return {"status": "error"}


@app.get("/api/logs", dependencies=[Depends(require_admin)])
def get_logs(level: Optional[str] = None, limit: int = 100, db: Session = Depends(get_db)):
    """Fetch logs from the database (admin only)"""
    query = db.query(AppLog).order_by(AppLog.timestamp.desc()).limit(limit)

    if level and level != "all":
        query = query.filter(AppLog.level == level)

    logs = query.all()
    return [
        {
            "id": log.id,
            "level": log.level,
            "message": log.message,
            "timestamp": log.timestamp,
            "source": log.source
        }
        for log in logs
    ]


@app.delete("/api/logs", dependencies=[Depends(require_admin)])
def clear_logs(db: Session = Depends(get_db)):
    """Clear all logs (admin only)"""
    db.query(AppLog).delete()
    db.commit()
    return {"message": "Logs cleared"}
