import json
import uuid
import datetime
import asyncio
import os

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import require_permission
from app.auth.context import TenantContext
from app.models.pipeline import PipelineJob
from app.schemas.pipeline import (
    PipelineJobAccepted, PipelineJobResult, PipelineJobListItem, ModelResult,
)
from app.services import pipeline_service

router = APIRouter()

UPLOAD_DIR = "/tmp/stockseer_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _job_to_result(job: PipelineJob) -> PipelineJobResult:
    model_results = None
    if job.model_results_json:
        raw = json.loads(job.model_results_json)
        model_results = [ModelResult(**r) for r in raw]

    forecast_data = None
    if job.forecast_json:
        forecast_data = json.loads(job.forecast_json)

    return PipelineJobResult(
        job_id=job.job_id,
        status=job.status,
        created_at=job.created_at.isoformat(),
        updated_at=job.updated_at.isoformat(),
        progress_pct=job.progress_pct,
        current_step=job.current_step,
        error=job.error,
        winner_model=job.winner_model,
        model_results=model_results,
        forecast_data=forecast_data,
        filename=job.filename,
    )


@router.post("/upload", response_model=PipelineJobAccepted, status_code=202)
async def upload_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    ctx: TenantContext = Depends(require_permission("forecast:write")),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted")

    job_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{job_id}_{file.filename}")

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    now = datetime.datetime.utcnow()
    job = PipelineJob(
        job_id=job_id,
        filename=file.filename,
        file_path=file_path,
        status="queued",
        log_text="",
        created_at=now,
        updated_at=now,
        tenant_id=ctx.tenant.id,
    )
    db.add(job)
    db.commit()

    background_tasks.add_task(pipeline_service.run_pipeline, job_id, file_path)

    return PipelineJobAccepted(
        job_id=job_id,
        status="queued",
        message=f"Job accepted. Poll /api/pipeline/jobs/{job_id} for status.",
    )


@router.get("/jobs", response_model=list[PipelineJobListItem])
def list_jobs(
    ctx: TenantContext = Depends(require_permission("forecast:read")),
    db: Session = Depends(get_db),
):
    jobs = (
        db.query(PipelineJob)
        .filter(PipelineJob.tenant_id == ctx.tenant.id)
        .order_by(PipelineJob.created_at.desc())
        .limit(10)
        .all()
    )
    return [
        PipelineJobListItem(
            job_id=j.job_id,
            filename=j.filename,
            status=j.status,
            created_at=j.created_at.isoformat(),
            winner_model=j.winner_model,
        )
        for j in jobs
    ]


@router.get("/jobs/{job_id}", response_model=PipelineJobResult)
def get_job(
    job_id: str,
    ctx: TenantContext = Depends(require_permission("forecast:read")),
    db: Session = Depends(get_db),
):
    job = db.query(PipelineJob).filter(
        PipelineJob.job_id == job_id,
        PipelineJob.tenant_id == ctx.tenant.id,
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _job_to_result(job)


@router.get("/jobs/{job_id}/stream")
async def stream_job_logs(
    job_id: str,
    ctx: TenantContext = Depends(require_permission("forecast:read")),
    db: Session = Depends(get_db),
):
    job = db.query(PipelineJob).filter(
        PipelineJob.job_id == job_id,
        PipelineJob.tenant_id == ctx.tenant.id,
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    async def event_generator():
        sent_lines = 0
        while True:
            db.expire(job)
            db.refresh(job)
            log_text = job.log_text or ""
            lines = [l for l in log_text.split("\n") if l.strip()]
            for line in lines[sent_lines:]:
                yield f"data: {line}\n\n"
                sent_lines += 1

            if job.status in ("completed", "failed"):
                yield f"data: {json.dumps({'step': 'done', 'status': job.status})}\n\n"
                break

            await asyncio.sleep(0.5)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
