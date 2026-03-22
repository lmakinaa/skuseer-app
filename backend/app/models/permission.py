import uuid
from sqlalchemy import Column, String

from app.database import Base


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    codename = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)


# All permission codenames in the system
ALL_PERMISSIONS = [
    ("product:read", "View products"),
    ("product:write", "Create and update products"),
    ("product:delete", "Delete products"),
    ("forecast:read", "View forecasts"),
    ("forecast:write", "Create and update forecasts"),
    ("forecast:delete", "Delete forecasts"),
    ("integration:read", "View integrations"),
    ("integration:write", "Manage integrations"),
    ("integration:delete", "Delete integrations"),
    ("tenant:read", "View tenant settings and members"),
    ("tenant:write", "Update tenant settings and invite members"),
    ("tenant:delete", "Remove members and delete tenant resources"),
    ("report:read", "View reports"),
    ("report:write", "Generate and schedule reports"),
    ("report:delete", "Delete reports"),
]
