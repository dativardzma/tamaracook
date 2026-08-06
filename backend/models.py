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
    push_token = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(Numeric, nullable=False)
    emoji = Column(String)
    description = Column(String, nullable=True)
    image_data = Column(Text, nullable=True)
    sale_price = Column(Numeric, nullable=True)
    category = Column(String, nullable=True)
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
    customer_email = Column(String, nullable=True)
    delivery_photo_data = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class OtpCode(Base):
    __tablename__ = "otp_codes"
    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, nullable=False, index=True)
    code = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ShopSettings(Base):
    __tablename__ = "shop_settings"
    id = Column(Integer, primary_key=True, index=True)
    shop_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    pickup_note = Column(String, nullable=True)
    weekdays_open = Column(String, nullable=True)
    weekdays_close = Column(String, nullable=True)
    saturday_open = Column(String, nullable=True)
    saturday_close = Column(String, nullable=True)
    sunday_open = Column(String, nullable=True)
    sunday_close = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AppLog(Base):
    __tablename__ = "app_logs"
    id = Column(Integer, primary_key=True, index=True)
    level = Column(String, nullable=False)  # 'log', 'error', 'warn', 'info'
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    source = Column(String, nullable=True)  # 'web', 'mobile'
