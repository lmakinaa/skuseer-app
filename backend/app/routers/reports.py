import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import require_permission
from app.auth.context import TenantContext
from app.models import Report
from app.schemas.report import ReportGenerateRequest, ReportScheduleRequest, ReportResponse

router = APIRouter()


@router.get("", response_model=list[ReportResponse])
def list_reports(
    ctx: TenantContext = Depends(require_permission("reports.view")),
    db: Session = Depends(get_db),
):
    rows = db.query(Report).filter(Report.tenant_id == ctx.tenant.id).all()
    return [ReportResponse.model_validate(r) for r in rows]


@router.post("/generate", response_model=ReportResponse, status_code=202)
def generate_report(
    body: ReportGenerateRequest,
    ctx: TenantContext = Depends(require_permission("reports.generate")),
    db: Session = Depends(get_db),
):
    report = Report(
        name=body.name,
        type=body.type,
        date=datetime.date.today().strftime("%b %d, %Y"),
        status="generating",
        recipients=body.recipients,
        tenant_id=ctx.tenant.id,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return ReportResponse.model_validate(report)


@router.post("/schedule", response_model=ReportResponse, status_code=202)
def schedule_report(
    body: ReportScheduleRequest,
    ctx: TenantContext = Depends(require_permission("reports.generate")),
    db: Session = Depends(get_db),
):
    report = Report(
        name=body.name,
        type=body.type,
        date=body.scheduled_date,
        status="scheduled",
        recipients=body.recipients,
        tenant_id=ctx.tenant.id,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return ReportResponse.model_validate(report)


@router.get("/{report_id}/download")
def download_report(
    report_id: int,
    ctx: TenantContext = Depends(require_permission("reports.view")),
    db: Session = Depends(get_db),
):
    report = db.query(Report).filter(
        Report.id == report_id,
        Report.tenant_id == ctx.tenant.id,
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.status != "delivered":
        raise HTTPException(status_code=400, detail="Report is not yet available for download")
    if not report.file_path:
        raise HTTPException(status_code=404, detail="Report file not found")
    return FileResponse(path=report.file_path, filename=f"{report.name}.csv")
