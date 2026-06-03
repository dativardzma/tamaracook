from sqlalchemy import Column, Integer, String, Numeric, Boolean
from database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(Numeric, nullable=False)
    emoji = Column(String)
    available = Column(Boolean, default=True)
