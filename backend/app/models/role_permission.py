import uuid
from sqlalchemy import Column, String, ForeignKey, UniqueConstraint

from app.database import Base


class RolePermission(Base):
    __tablename__ = "role_permissions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    role_id = Column(String, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    permission_id = Column(String, ForeignKey("permissions.id"), nullable=False)

    __table_args__ = (UniqueConstraint("role_id", "permission_id"),)
