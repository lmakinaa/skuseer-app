import uuid
from datetime import datetime, timezone
from typing import Callable

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.models.tenant_membership import TenantMembership
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.permission import Permission
from app.auth.jwt import decode_token
from app.auth.context import TenantContext


async def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

    token = auth_header.split(" ", 1)[1]
    claims = await decode_token(token)

    sub = claims.get("sub")
    email = claims.get("email", "")
    name = claims.get("name", claims.get("preferred_username", ""))

    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing sub claim",
        )

    # JIT provisioning: create user on first login
    user = db.query(User).filter(User.keycloak_sub == sub).first()
    if user is None:
        # Check if user has platform_admin realm role
        realm_roles = claims.get("realm_access", {}).get("roles", [])
        is_admin = "platform_admin" in realm_roles

        user = User(
            id=str(uuid.uuid4()),
            keycloak_sub=sub,
            email=email,
            full_name=name,
            is_platform_admin=is_admin,
        )
        db.add(user)
        db.flush()
    else:
        # Update info from token on each login
        if email and user.email != email:
            user.email = email
        if name and user.full_name != name:
            user.full_name = name
        # Sync platform_admin from Keycloak realm roles
        realm_roles = claims.get("realm_access", {}).get("roles", [])
        user.is_platform_admin = "platform_admin" in realm_roles

    # Auto-provision: if user has no tenant memberships, assign to the first
    # active tenant with the default role. This handles JIT-created users and
    # existing users who lost their memberships.
    has_membership = (
        db.query(TenantMembership)
        .filter(TenantMembership.user_id == user.id, TenantMembership.is_active == True)
        .first()
    )
    if not has_membership:
        first_tenant = db.query(Tenant).filter(Tenant.is_active == True).first()
        if first_tenant:
            default_role = (
                db.query(Role)
                .filter(Role.tenant_id == first_tenant.id, Role.is_default == True)
                .first()
            )
            if default_role:
                db.add(TenantMembership(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    tenant_id=first_tenant.id,
                    role_id=default_role.id,
                    is_active=True,
                ))

    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    return user


async def get_tenant_context(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TenantContext:
    tenant_id = request.headers.get("X-Tenant-ID")
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing X-Tenant-ID header",
        )

    tenant = db.query(Tenant).filter(Tenant.id == tenant_id, Tenant.is_active == True).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )

    membership = (
        db.query(TenantMembership)
        .filter(
            TenantMembership.user_id == current_user.id,
            TenantMembership.tenant_id == tenant_id,
            TenantMembership.is_active == True,
        )
        .first()
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this tenant",
        )

    role = db.query(Role).filter(Role.id == membership.role_id).first()

    # Load permissions for this role
    permission_rows = (
        db.query(Permission.codename)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .filter(RolePermission.role_id == role.id)
        .all()
    )
    permissions = {row.codename for row in permission_rows}

    return TenantContext(
        tenant=tenant,
        user=current_user,
        membership=membership,
        role=role,
        permissions=permissions,
    )


def require_permission(permission: str) -> Callable:
    async def _check(ctx: TenantContext = Depends(get_tenant_context)):
        if permission not in ctx.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing permission: {permission}",
            )
        return ctx
    return _check


async def require_platform_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_platform_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform admin access required",
        )
    return current_user
