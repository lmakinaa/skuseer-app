from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    date = Column(String, nullable=False)       # ISO date
    status = Column(String, nullable=False)     # "delivered" | "scheduled" | "generating"
    recipients = Column(String, nullable=False)
    file_path = Column(String, nullable=True)   # local path to generated file
