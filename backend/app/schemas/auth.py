from pydantic import BaseModel


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str | None
    is_platform_admin: bool


class TenantMembershipResponse(BaseModel):
    tenant_id: str
    tenant_name: str
    tenant_slug: str
    role_id: str
    role_name: str


class MeResponse(BaseModel):
    user: UserResponse
    tenants: list[TenantMembershipResponse]
