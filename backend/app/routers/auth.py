from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.tenant_membership import TenantMembership
from app.models.tenant import Tenant
from app.models.role import Role
from app.schemas.auth import MeResponse, UserResponse, TenantMembershipResponse

router = APIRouter()


@router.get("/me", response_model=MeResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    memberships = (
        db.query(TenantMembership, Tenant, Role)
        .join(Tenant, TenantMembership.tenant_id == Tenant.id)
        .join(Role, TenantMembership.role_id == Role.id)
        .filter(
            TenantMembership.user_id == current_user.id,
            TenantMembership.is_active == True,
            Tenant.is_active == True,
        )
        .all()
    )

    return MeResponse(
        user=UserResponse(
            id=current_user.id,
            email=current_user.email,
            full_name=current_user.full_name,
            is_platform_admin=current_user.is_platform_admin,
        ),
        tenants=[
            TenantMembershipResponse(
                tenant_id=t.id,
                tenant_name=t.name,
                tenant_slug=t.slug,
                role_id=r.id,
                role_name=r.name,
            )
            for m, t, r in memberships
        ],
    )
