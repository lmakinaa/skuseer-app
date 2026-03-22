from sqlalchemy import Column, String, Integer, DateTime, Text
from app.database import Base


class PipelineJob(Base):
    __tablename__ = "pipeline_jobs"

    job_id = Column(String, primary_key=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    status = Column(String, nullable=False, default="queued")  # queued|running|completed|failed
    current_step = Column(String, nullable=True)
    progress_pct = Column(Integer, nullable=True)
    winner_model = Column(String, nullable=True)
    model_results_json = Column(Text, nullable=True)    # JSON list of ModelResult
    forecast_json = Column(Text, nullable=True)         # JSON list of {date, predicted}
    log_text = Column(Text, nullable=True, default="")  # newline-delimited log lines for SSE
    error = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
