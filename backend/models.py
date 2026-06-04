from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    is_delivery = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(Numeric, nullable=False)
    emoji = Column(String)
    description = Column(String, nullable=True)
    image_data = Column(Text, nullable=True)   # base64 data URL stored directly
    available = Column(Boolean, default=True)


class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    customer_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    address = Column(String, nullable=True)
    order_type = Column(String, default="delivery")
    items = Column(Text, nullable=False)
    total = Column(Numeric, nullable=False)
    status = Column(String, default="pending")
    order_code = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
