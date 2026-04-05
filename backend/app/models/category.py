import uuid
from sqlalchemy import Column, String, Float, Integer, ForeignKey
from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=True, index=True)
    name = Column(String, nullable=False)
    products = Column(Integer, nullable=False, default=0)
    accuracy = Column(Float, nullable=False, default=0.0)
    trend = Column(String, nullable=False, default="stable")   # "up" | "down" | "stable"


class Subcategory(Base):
    __tablename__ = "subcategories"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    category_id = Column(String, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
