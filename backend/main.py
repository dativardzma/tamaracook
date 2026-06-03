from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import Base, engine, get_db
from models import Product, Order

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class OrderCreate(BaseModel):
    customer_name: str
    phone: str
    items: str
    total: float


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
