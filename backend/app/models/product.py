from sqlalchemy import Column, String, Float, Integer, ForeignKey
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True)   # e.g. "DAI-001"
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    forecast = Column(Integer, nullable=False)
    last_month = Column(Integer, nullable=False)
    change = Column(Float, nullable=False)       # percent, e.g. 8.0
    accuracy = Column(Float, nullable=False)
    stock = Column(Integer, nullable=False)
    reorder_point = Column(Integer, nullable=False)
