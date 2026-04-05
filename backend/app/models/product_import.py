from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, func
from app.database import Base


class ProductImportJob(Base):
    __tablename__ = "product_import_jobs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False, index=True)
    filename = Column(String, nullable=False)
    items_count = Column(Integer, nullable=False, default=0)
    status = Column(String, nullable=False, default="completed")  # completed | failed | processing
    created_at = Column(DateTime, nullable=False, server_default=func.now())
