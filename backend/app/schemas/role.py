from pydantic import BaseModel


class PermissionResponse(BaseModel):
    id: str
    codename: str
    description: str | None


class RoleCreate(BaseModel):
    name: str
    description: str | None = None
    is_default: bool = False


class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_default: bool | None = None


class RoleResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    description: str | None
    is_default: bool


class RoleWithPermissionsResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    description: str | None
    is_default: bool
    permissions: list[PermissionResponse]


class SetPermissionsRequest(BaseModel):
    permission_ids: list[str]
