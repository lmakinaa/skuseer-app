"""
ML pipeline — placeholder.

The actual forecasting logic (ARIMA, Prophet, XGBoost, LSTM) is handled by
a separate service maintained in a separate repo. This stub accepts the CSV
upload, stores the job, and marks it as pending so the external service can
pick it up.

When the external service is ready, it should:
  1. Poll or receive webhooks for jobs with status="queued"
  2. Write results back to the pipeline_jobs table
     (model_results_json, forecast_json, winner_model, status="completed")
"""
import datetime

from app.database import SessionLocal
from app.models.pipeline import PipelineJob


def run_pipeline(job_id: str, file_path: str):
    """
    Placeholder — does not run any ML models.
    Marks the job as pending external service and returns immediately.
    """
    db = SessionLocal()
    try:
        job = db.query(PipelineJob).filter(PipelineJob.job_id == job_id).first()
        if job:
            job.status = "queued"
            job.current_step = "awaiting_external_service"
            job.log_text = (
                '{"step": "info", "message": "Job queued. Awaiting external forecasting service."}\n'
            )
            job.updated_at = datetime.datetime.utcnow()
            db.commit()
    finally:
        db.close()
