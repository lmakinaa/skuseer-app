import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.auth.dependencies import require_platform_admin
from app.models.user import User
from app.models.tenant import Tenant
from app.models.tenant_membership import TenantMembership
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.permission import Permission
from app.schemas.tenant import TenantCreate, TenantUpdate, TenantResponse
from app.schemas.auth import UserResponse

router = APIRouter()


@router.get("/tenants", response_model=list[TenantResponse])
async def list_tenants(
    admin: User = Depends(require_platform_admin),
    db: Session = Depends(get_db),
):
    tenants = db.query(Tenant).order_by(Tenant.created_at.desc()).all()
    result = []
    for t in tenants:
        count = db.query(TenantMembership).filter(
            TenantMembership.tenant_id == t.id,
            TenantMembership.is_active == True,
        ).count()
        result.append(TenantResponse(
            id=t.id, name=t.name, slug=t.slug, location=t.location,
            is_active=t.is_active, created_at=t.created_at, member_count=count,
        ))
    return result


@router.post("/tenants", response_model=TenantResponse, status_code=201)
async def create_tenant(
    body: TenantCreate,
    admin: User = Depends(require_platform_admin),
    db: Session = Depends(get_db),
):
    existing = db.query(Tenant).filter(Tenant.slug == body.slug).first()
    if existing:
        raise HTTPException(status_code=409, detail="Tenant with this slug already exists")

    tenant = Tenant(
        id=str(uuid.uuid4()),
        name=body.name,
        slug=body.slug,
        location=body.location,
        is_active=True,
    )
    db.add(tenant)
    db.flush()

    # Create default roles for the new tenant
    all_perms = db.query(Permission).all()

    # Store Admin — all permissions
    admin_role = Role(
        id=str(uuid.uuid4()), tenant_id=tenant.id,
        name="Store Admin", description="Full access to all store features",
    )
    db.add(admin_role)
    db.flush()
    for p in all_perms:
        db.add(RolePermission(id=str(uuid.uuid4()), role_id=admin_role.id, permission_id=p.id))

    # Store Manager — read + write
    manager_role = Role(
        id=str(uuid.uuid4()), tenant_id=tenant.id,
        name="Store Manager", description="Can view and edit, but not delete",
        is_default=True,
    )
    db.add(manager_role)
    db.flush()
    for p in all_perms:
        if "delete" not in p.codename:
            db.add(RolePermission(id=str(uuid.uuid4()), role_id=manager_role.id, permission_id=p.id))

    # Viewer — read only
    viewer_role = Role(
        id=str(uuid.uuid4()), tenant_id=tenant.id,
        name="Viewer", description="Read-only access",
    )
    db.add(viewer_role)
    db.flush()
    viewer_perms = {
        "dashboard.view",
        "products.view",
        "forecasts.view",
        "promotions.view",
        "reports.view",
        "settings.store",
    }
    for p in all_perms:
        if p.codename in viewer_perms:
            db.add(RolePermission(id=str(uuid.uuid4()), role_id=viewer_role.id, permission_id=p.id))

    db.commit()
    return TenantResponse(
        id=tenant.id, name=tenant.name, slug=tenant.slug,
        location=tenant.location, is_active=tenant.is_active,
        created_at=tenant.created_at, member_count=0,
    )


@router.get("/tenants/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: str,
    admin: User = Depends(require_platform_admin),
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    count = db.query(TenantMembership).filter(
        TenantMembership.tenant_id == tenant.id,
        TenantMembership.is_active == True,
    ).count()
    return TenantResponse(
        id=tenant.id, name=tenant.name, slug=tenant.slug,
        location=tenant.location, is_active=tenant.is_active,
        created_at=tenant.created_at, member_count=count,
    )


@router.patch("/tenants/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: str,
    body: TenantUpdate,
    admin: User = Depends(require_platform_admin),
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    if body.name is not None:
        tenant.name = body.name
    if body.location is not None:
        tenant.location = body.location
    db.commit()
    db.refresh(tenant)
    return TenantResponse(
        id=tenant.id, name=tenant.name, slug=tenant.slug,
        location=tenant.location, is_active=tenant.is_active,
        created_at=tenant.created_at,
    )


@router.delete("/tenants/{tenant_id}", status_code=204)
async def deactivate_tenant(
    tenant_id: str,
    admin: User = Depends(require_platform_admin),
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    tenant.is_active = False
    db.commit()


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    admin: User = Depends(require_platform_admin),
    db: Session = Depends(get_db),
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        UserResponse(
            id=u.id, email=u.email, full_name=u.full_name,
            is_platform_admin=u.is_platform_admin,
        )
        for u in users
    ]


@router.patch("/users/{user_id}", response_model=UserResponse)
async def toggle_platform_admin(
    user_id: str,
    admin: User = Depends(require_platform_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_platform_admin = not user.is_platform_admin
    db.commit()
    return UserResponse(
        id=user.id, email=user.email, full_name=user.full_name,
        is_platform_admin=user.is_platform_admin,
    )
