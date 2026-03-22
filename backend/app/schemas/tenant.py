from pydantic import BaseModel
from datetime import datetime


class TenantCreate(BaseModel):
    name: str
    slug: str
    location: str | None = None


class TenantUpdate(BaseModel):
    name: str | None = None
    location: str | None = None


class TenantResponse(BaseModel):
    id: str
    name: str
    slug: str
    location: str | None
    is_active: bool
    created_at: datetime | None
    member_count: int | None = None


class MemberInviteRequest(BaseModel):
    email: str
    role_id: str


class MemberResponse(BaseModel):
    user_id: str
    email: str
    full_name: str | None
    role_id: str
    role_name: str
    is_active: bool
    accepted_at: datetime | None


class MemberRoleUpdate(BaseModel):
    role_id: str
