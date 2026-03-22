import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import get_tenant_context, require_permission
from app.auth.context import TenantContext
from app.models.tenant_membership import TenantMembership
from app.models.user import User
from app.models.role import Role
from app.schemas.tenant import (
    TenantResponse,
    TenantUpdate,
    MemberInviteRequest,
    MemberResponse,
    MemberRoleUpdate,
)
from app.services.email_service import send_invite_email

router = APIRouter()


@router.get("/current", response_model=TenantResponse)
async def get_current_tenant(
    ctx: TenantContext = Depends(require_permission("tenant:read")),
    db: Session = Depends(get_db),
):
    count = db.query(TenantMembership).filter(
        TenantMembership.tenant_id == ctx.tenant.id,
        TenantMembership.is_active == True,
    ).count()
    return TenantResponse(
        id=ctx.tenant.id,
        name=ctx.tenant.name,
        slug=ctx.tenant.slug,
        location=ctx.tenant.location,
        is_active=ctx.tenant.is_active,
        created_at=ctx.tenant.created_at,
        member_count=count,
    )


@router.patch("/current", response_model=TenantResponse)
async def update_current_tenant(
    body: TenantUpdate,
    ctx: TenantContext = Depends(require_permission("tenant:write")),
    db: Session = Depends(get_db),
):
    if body.name is not None:
        ctx.tenant.name = body.name
    if body.location is not None:
        ctx.tenant.location = body.location
    db.commit()
    db.refresh(ctx.tenant)
    return TenantResponse(
        id=ctx.tenant.id,
        name=ctx.tenant.name,
        slug=ctx.tenant.slug,
        location=ctx.tenant.location,
        is_active=ctx.tenant.is_active,
        created_at=ctx.tenant.created_at,
    )


@router.get("/current/members", response_model=list[MemberResponse])
async def list_members(
    ctx: TenantContext = Depends(require_permission("tenant:read")),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(TenantMembership, User, Role)
        .join(User, TenantMembership.user_id == User.id)
        .join(Role, TenantMembership.role_id == Role.id)
        .filter(TenantMembership.tenant_id == ctx.tenant.id)
        .all()
    )
    return [
        MemberResponse(
            user_id=u.id,
            email=u.email,
            full_name=u.full_name,
            role_id=r.id,
            role_name=r.name,
            is_active=m.is_active,
            accepted_at=m.accepted_at,
        )
        for m, u, r in rows
    ]


@router.post("/current/members/invite", response_model=MemberResponse, status_code=201)
async def invite_member(
    body: MemberInviteRequest,
    ctx: TenantContext = Depends(require_permission("tenant:write")),
    db: Session = Depends(get_db),
):
    # Validate role belongs to this tenant
    role = db.query(Role).filter(Role.id == body.role_id, Role.tenant_id == ctx.tenant.id).first()
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role for this tenant")

    # Find or create user by email
    user = db.query(User).filter(User.email == body.email).first()
    if user is None:
        user = User(
            id=str(uuid.uuid4()),
            keycloak_sub=f"pending-{uuid.uuid4()}",
            email=body.email,
            full_name=None,
            is_platform_admin=False,
        )
        db.add(user)
        db.flush()

    # Check if already a member
    existing = db.query(TenantMembership).filter(
        TenantMembership.user_id == user.id,
        TenantMembership.tenant_id == ctx.tenant.id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="User is already a member of this tenant")

    membership = TenantMembership(
        id=str(uuid.uuid4()),
        user_id=user.id,
        tenant_id=ctx.tenant.id,
        role_id=role.id,
        invited_by=ctx.user.id,
        invited_at=datetime.now(timezone.utc),
        is_active=True,
    )
    db.add(membership)
    db.commit()

    # Send invite email
    app_url = os.getenv("APP_URL", "http://localhost:8080")
    invite_link = f"{app_url}?tenant={ctx.tenant.slug}"
    send_invite_email(
        to_email=body.email,
        tenant_name=ctx.tenant.name,
        inviter_name=ctx.user.full_name or ctx.user.email,
        invite_link=invite_link,
    )

    return MemberResponse(
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role_id=role.id,
        role_name=role.name,
        is_active=membership.is_active,
        accepted_at=membership.accepted_at,
    )


@router.delete("/current/members/{user_id}", status_code=204)
async def remove_member(
    user_id: str,
    ctx: TenantContext = Depends(require_permission("tenant:delete")),
    db: Session = Depends(get_db),
):
    if user_id == ctx.user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")

    membership = db.query(TenantMembership).filter(
        TenantMembership.user_id == user_id,
        TenantMembership.tenant_id == ctx.tenant.id,
    ).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")

    membership.is_active = False
    db.commit()


@router.patch("/current/members/{user_id}/role", response_model=MemberResponse)
async def change_member_role(
    user_id: str,
    body: MemberRoleUpdate,
    ctx: TenantContext = Depends(require_permission("tenant:write")),
    db: Session = Depends(get_db),
):
    role = db.query(Role).filter(Role.id == body.role_id, Role.tenant_id == ctx.tenant.id).first()
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role for this tenant")

    membership = db.query(TenantMembership).filter(
        TenantMembership.user_id == user_id,
        TenantMembership.tenant_id == ctx.tenant.id,
    ).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")

    membership.role_id = role.id
    db.commit()

    user = db.query(User).filter(User.id == user_id).first()
    return MemberResponse(
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role_id=role.id,
        role_name=role.name,
        is_active=membership.is_active,
        accepted_at=membership.accepted_at,
    )
