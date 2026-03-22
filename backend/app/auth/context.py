from dataclasses import dataclass

from app.models.tenant import Tenant
from app.models.user import User
from app.models.tenant_membership import TenantMembership
from app.models.role import Role


@dataclass
class TenantContext:
    tenant: Tenant
    user: User
    membership: TenantMembership
    role: Role
    permissions: set[str]
