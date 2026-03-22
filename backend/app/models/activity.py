from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.database import Base


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=True, index=True)
    created_at = Column(DateTime, nullable=False)
    text = Column(String, nullable=False)
    type = Column(String, nullable=False)   # "success" | "warning" | "info"
