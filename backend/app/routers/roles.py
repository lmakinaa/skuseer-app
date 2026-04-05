import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import require_permission
from app.auth.context import TenantContext
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.permission import Permission
from app.models.tenant_membership import TenantMembership
from app.schemas.role import (
    RoleCreate,
    RoleUpdate,
    RoleResponse,
    RoleWithPermissionsResponse,
    PermissionResponse,
    SetPermissionsRequest,
)

router = APIRouter()


@router.get("/", response_model=list[RoleResponse])
async def list_roles(
    ctx: TenantContext = Depends(require_permission("settings.roles")),
    db: Session = Depends(get_db),
):
    roles = db.query(Role).filter(Role.tenant_id == ctx.tenant.id).all()
    return [
        RoleResponse(
            id=r.id, tenant_id=r.tenant_id, name=r.name,
            description=r.description, is_default=r.is_default,
        )
        for r in roles
    ]


@router.post("/", response_model=RoleResponse, status_code=201)
async def create_role(
    body: RoleCreate,
    ctx: TenantContext = Depends(require_permission("settings.roles")),
    db: Session = Depends(get_db),
):
    existing = db.query(Role).filter(
        Role.tenant_id == ctx.tenant.id, Role.name == body.name
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Role with this name already exists")

    role = Role(
        id=str(uuid.uuid4()),
        tenant_id=ctx.tenant.id,
        name=body.name,
        description=body.description,
        is_default=body.is_default,
    )
    db.add(role)

    # If this role is marked as default, unset other defaults
    if body.is_default:
        db.query(Role).filter(
            Role.tenant_id == ctx.tenant.id, Role.id != role.id
        ).update({"is_default": False})

    db.commit()
    db.refresh(role)
    return RoleResponse(
        id=role.id, tenant_id=role.tenant_id, name=role.name,
        description=role.description, is_default=role.is_default,
    )


@router.get("/permissions", response_model=list[PermissionResponse])
async def list_all_permissions(
    ctx: TenantContext = Depends(require_permission("settings.roles")),
    db: Session = Depends(get_db),
):
    perms = db.query(Permission).order_by(Permission.codename).all()
    return [
        PermissionResponse(id=p.id, codename=p.codename, description=p.description)
        for p in perms
    ]


@router.get("/{role_id}", response_model=RoleWithPermissionsResponse)
async def get_role(
    role_id: str,
    ctx: TenantContext = Depends(require_permission("settings.roles")),
    db: Session = Depends(get_db),
):
    role = db.query(Role).filter(Role.id == role_id, Role.tenant_id == ctx.tenant.id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    perms = (
        db.query(Permission)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .filter(RolePermission.role_id == role.id)
        .all()
    )
    return RoleWithPermissionsResponse(
        id=role.id, tenant_id=role.tenant_id, name=role.name,
        description=role.description, is_default=role.is_default,
        permissions=[
            PermissionResponse(id=p.id, codename=p.codename, description=p.description)
            for p in perms
        ],
    )


@router.patch("/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: str,
    body: RoleUpdate,
    ctx: TenantContext = Depends(require_permission("settings.roles")),
    db: Session = Depends(get_db),
):
    role = db.query(Role).filter(Role.id == role_id, Role.tenant_id == ctx.tenant.id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    if body.name is not None:
        role.name = body.name
    if body.description is not None:
        role.description = body.description
    if body.is_default is not None:
        role.is_default = body.is_default
        if body.is_default:
            db.query(Role).filter(
                Role.tenant_id == ctx.tenant.id, Role.id != role.id
            ).update({"is_default": False})

    db.commit()
    db.refresh(role)
    return RoleResponse(
        id=role.id, tenant_id=role.tenant_id, name=role.name,
        description=role.description, is_default=role.is_default,
    )


@router.delete("/{role_id}", status_code=204)
async def delete_role(
    role_id: str,
    ctx: TenantContext = Depends(require_permission("settings.roles")),
    db: Session = Depends(get_db),
):
    role = db.query(Role).filter(Role.id == role_id, Role.tenant_id == ctx.tenant.id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Prevent deletion if members are assigned
    member_count = db.query(TenantMembership).filter(
        TenantMembership.role_id == role_id,
        TenantMembership.is_active == True,
    ).count()
    if member_count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete role with {member_count} active member(s). Reassign them first.",
        )

    db.query(RolePermission).filter(RolePermission.role_id == role_id).delete()
    db.delete(role)
    db.commit()


@router.put("/{role_id}/permissions", response_model=RoleWithPermissionsResponse)
async def set_role_permissions(
    role_id: str,
    body: SetPermissionsRequest,
    ctx: TenantContext = Depends(require_permission("settings.roles")),
    db: Session = Depends(get_db),
):
    role = db.query(Role).filter(Role.id == role_id, Role.tenant_id == ctx.tenant.id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Validate all permission IDs exist
    valid_perms = db.query(Permission).filter(Permission.id.in_(body.permission_ids)).all()
    if len(valid_perms) != len(body.permission_ids):
        raise HTTPException(status_code=400, detail="Some permission IDs are invalid")

    # Replace all permissions
    db.query(RolePermission).filter(RolePermission.role_id == role_id).delete()
    for p in valid_perms:
        db.add(RolePermission(id=str(uuid.uuid4()), role_id=role_id, permission_id=p.id))
    db.commit()

    return RoleWithPermissionsResponse(
        id=role.id, tenant_id=role.tenant_id, name=role.name,
        description=role.description, is_default=role.is_default,
        permissions=[
            PermissionResponse(id=p.id, codename=p.codename, description=p.description)
            for p in valid_perms
        ],
    )
