import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from database import Base, engine, get_db
from models import Product, Order, User
from auth import hash_password, verify_password, create_token, get_current_user, get_current_user_optional, require_admin, require_delivery

Base.metadata.create_all(bind=engine)

# Safe additive migrations
with engine.connect() as _conn:
    _conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_delivery BOOLEAN DEFAULT false"))
    _conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)"))
    _conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'pending'"))
    _conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR DEFAULT 'delivery'"))
    _conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS address VARCHAR"))
    _conn.commit()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    emoji: str
    available: bool = True

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    emoji: Optional[str] = None
    available: Optional[bool] = None


def user_response(user, token):
    return {
        "token": token,
        "email": user.email,
        "is_admin": user.is_admin,
        "is_delivery": user.is_delivery,
    }


# Auth
@app.post("/api/auth/register")
def register(data: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=data.email, password=hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user_response(user, create_token(user.id))

@app.post("/api/auth/admin/signup")
def admin_signup(data: AdminSignup, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=data.email, password=hash_password(data.password), is_admin=True)
    db.add(user)
    db.commit()
    return {"message": "Admin account created"}

@app.post("/api/auth/delivery/signup", dependencies=[Depends(require_admin)])
def delivery_signup(data: AdminSignup, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=data.email, password=hash_password(data.password), is_delivery=True)
    db.add(user)
    db.commit()
    return {"message": "Delivery account created"}

@app.post("/api/auth/login")
def login(data: Login, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return user_response(user, create_token(user.id))


# Public
@app.get("/api/products")
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).filter(Product.available == True).all()

@app.post("/api/orders")
def create_order(order: OrderCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user_optional)):
    db_order = Order(**order.model_dump(), user_id=current_user.id if current_user else None)
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return {"message": "Order placed successfully!", "id": db_order.id}

@app.get("/api/orders/my")
def my_orders(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()

@app.get("/api/health")
def health():
    return {"status": "ok"}


# Delivery
@app.get("/api/delivery/orders")
def delivery_orders(db: Session = Depends(get_db), user=Depends(require_delivery)):
    return db.query(Order).filter(Order.order_type == "delivery").order_by(Order.created_at.desc()).all()

@app.put("/api/delivery/orders/{order_id}/status")
def delivery_update_status(order_id: int, data: OrderStatusUpdate, db: Session = Depends(get_db), user=Depends(require_delivery)):
    allowed = ["out_for_delivery", "delivered"]
    if data.status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid status for delivery")
    order = db.query(Order).filter(Order.id == order_id, Order.order_type == "delivery").first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = data.status
    db.commit()
    return {"message": "Status updated"}


# Admin
@app.get("/api/admin/products", dependencies=[Depends(require_admin)])
def admin_get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()

@app.post("/api/admin/products", dependencies=[Depends(require_admin)])
def admin_create_product(product: ProductCreate, db: Session = Depends(get_db)):
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@app.put("/api/admin/products/{product_id}", dependencies=[Depends(require_admin)])
def admin_update_product(product_id: int, data: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product

@app.delete("/api/admin/products/{product_id}", dependencies=[Depends(require_admin)])
def admin_delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"message": "Product deleted"}

@app.get("/api/admin/orders", dependencies=[Depends(require_admin)])
def admin_get_orders(db: Session = Depends(get_db)):
    return db.query(Order).order_by(Order.created_at.desc()).all()

@app.put("/api/admin/orders/{order_id}/status", dependencies=[Depends(require_admin)])
def admin_update_order_status(order_id: int, data: OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = data.status
    db.commit()
    return {"message": "Status updated"}

@app.get("/api/admin/team", dependencies=[Depends(require_admin)])
def admin_get_team(db: Session = Depends(get_db)):
    users = db.query(User).filter(User.is_delivery == True).all()
    return [{"id": u.id, "email": u.email, "created_at": u.created_at} for u in users]
