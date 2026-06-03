from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import Base, engine, get_db
from models import Product

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/products")
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).filter(Product.available == True).all()


@app.get("/api/health")
def health():
    return {"status": "ok"}
