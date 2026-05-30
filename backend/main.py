from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

products = [
    {"id": 1, "name": "Chocolate Cake", "price": 25, "emoji": "🍫"},
    {"id": 2, "name": "Strawberry Tart", "price": 18, "emoji": "🍓"},
    {"id": 3, "name": "Vanilla Cupcake", "price": 8, "emoji": "🧁"},
    {"id": 4, "name": "Macarons (6pcs)", "price": 15, "emoji": "🍬"},
    {"id": 5, "name": "Honey Baklava", "price": 12, "emoji": "🍯"},
]


@app.get("/api/products")
def get_products():
    return products


@app.get("/api/health")
def health():
    return {"status": "ok"}
