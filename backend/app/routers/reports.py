import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Report
from app.schemas.report import ReportGenerateRequest, ReportScheduleRequest, ReportResponse

router = APIRouter()


@router.get("", response_model=list[ReportResponse])
def list_reports(db: Session = Depends(get_db)):
    return [ReportResponse.model_validate(r) for r in db.query(Report).all()]


@router.post("/generate", response_model=ReportResponse, status_code=202)
def generate_report(body: ReportGenerateRequest, db: Session = Depends(get_db)):
    report = Report(
        name=body.name,
        type=body.type,
        date=datetime.date.today().strftime("%b %d, %Y"),
        status="generating",
        recipients=body.recipients,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return ReportResponse.model_validate(report)


@router.post("/schedule", response_model=ReportResponse, status_code=202)
def schedule_report(body: ReportScheduleRequest, db: Session = Depends(get_db)):
    report = Report(
        name=body.name,
        type=body.type,
        date=body.scheduled_date,
        status="scheduled",
        recipients=body.recipients,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return ReportResponse.model_validate(report)


@router.get("/{report_id}/download")
def download_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.status != "delivered":
        raise HTTPException(status_code=400, detail="Report is not yet available for download")
    if not report.file_path:
        raise HTTPException(status_code=404, detail="Report file not found")
    return FileResponse(path=report.file_path, filename=f"{report.name}.csv")
