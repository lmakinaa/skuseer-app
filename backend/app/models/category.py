from sqlalchemy import Column, String, Float, Integer, ForeignKey
from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    name = Column(String, primary_key=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=True, index=True)
    products = Column(Integer, nullable=False)
    accuracy = Column(Float, nullable=False)
    trend = Column(String, nullable=False)   # "up" | "down" | "stable"
