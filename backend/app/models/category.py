from sqlalchemy import Column, String, Float, Integer
from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    name = Column(String, primary_key=True)
    products = Column(Integer, nullable=False)
    accuracy = Column(Float, nullable=False)
    trend = Column(String, nullable=False)   # "up" | "down" | "stable"
