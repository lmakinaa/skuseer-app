import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import require_permission
from app.auth.context import TenantContext
from app.models import Integration
from app.schemas.integration import IntegrationResponse

router = APIRouter()


def _human_sync(last_synced_at) -> str:
    if not last_synced_at:
        return "Never"
    diff = datetime.datetime.utcnow() - last_synced_at
    secs = diff.total_seconds()
    if secs < 120:
        return "Live"
    if secs < 3600:
        return f"{int(secs / 60)} min ago"
    if secs < 86400:
        return f"{int(secs / 3600)} hr ago"
    return f"{int(secs / 86400)} days ago"


def _to_response(integration: Integration) -> IntegrationResponse:
    return IntegrationResponse(
        id=integration.id,
        name=integration.name,
        description=integration.description,
        provider=integration.provider,
        status=integration.status,
        last_sync=_human_sync(integration.last_synced_at),
        data_points=integration.data_points,
        impact=integration.impact,
    )


@router.get("", response_model=list[IntegrationResponse])
def list_integrations(
    ctx: TenantContext = Depends(require_permission("integration:read")),
    db: Session = Depends(get_db),
):
    rows = db.query(Integration).filter(Integration.tenant_id == ctx.tenant.id).all()
    return [_to_response(i) for i in rows]


@router.post("/{integration_id}/connect", response_model=IntegrationResponse)
def connect_integration(
    integration_id: str,
    ctx: TenantContext = Depends(require_permission("integration:write")),
    db: Session = Depends(get_db),
):
    integration = db.query(Integration).filter(
        Integration.id == integration_id,
        Integration.tenant_id == ctx.tenant.id,
    ).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    integration.status = "connected"
    integration.last_synced_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(integration)
    return _to_response(integration)


@router.post("/{integration_id}/disconnect", response_model=IntegrationResponse)
def disconnect_integration(
    integration_id: str,
    ctx: TenantContext = Depends(require_permission("integration:write")),
    db: Session = Depends(get_db),
):
    integration = db.query(Integration).filter(
        Integration.id == integration_id,
        Integration.tenant_id == ctx.tenant.id,
    ).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    integration.status = "disconnected"
    db.commit()
    db.refresh(integration)
    return _to_response(integration)


@router.post("/{integration_id}/refresh", response_model=IntegrationResponse)
def refresh_integration(
    integration_id: str,
    ctx: TenantContext = Depends(require_permission("integration:write")),
    db: Session = Depends(get_db),
):
    integration = db.query(Integration).filter(
        Integration.id == integration_id,
        Integration.tenant_id == ctx.tenant.id,
    ).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    if integration.status != "connected":
        raise HTTPException(status_code=400, detail="Integration is not connected")
    integration.last_synced_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(integration)
    return _to_response(integration)
