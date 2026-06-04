import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import Base, engine, get_db
from models import Product, Order, User
from auth import hash_password, verify_password, create_token, require_admin

Base.metadata.create_all(bind=engine)

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
    items: str
    total: float

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


# Auth
@app.post("/api/auth/register")
def register(data: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=data.email, password=hash_password(data.password), is_admin=False)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": create_token(user.id), "is_admin": user.is_admin, "email": user.email}

@app.post("/api/auth/admin/signup")
def admin_signup(data: AdminSignup, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=data.email, password=hash_password(data.password), is_admin=True)
    db.add(user)
    db.commit()
    return {"message": "Admin account created"}

@app.post("/api/auth/login")
def login(data: Login, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"token": create_token(user.id), "is_admin": user.is_admin, "email": user.email}


# Public
@app.get("/api/products")
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).filter(Product.available == True).all()

@app.post("/api/orders")
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    db_order = Order(**order.model_dump())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return {"message": "Order placed successfully!", "id": db_order.id}

@app.get("/api/health")
def health():
    return {"status": "ok"}


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
