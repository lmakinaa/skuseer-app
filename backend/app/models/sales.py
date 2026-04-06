from sqlalchemy import Column, Integer, String, Date, ForeignKey, UniqueConstraint
from app.database import Base


class SalesRecord(Base):
    __tablename__ = "sales_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False, index=True)
    product_id = Column(String, ForeignKey("products.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    quantity = Column(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "tenant_id", "product_id", "date",
            name="uq_sales_tenant_product_date",
        ),
    )
