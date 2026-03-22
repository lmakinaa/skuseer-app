from pydantic import BaseModel
from typing import Literal, Optional


class ModelResult(BaseModel):
    model_config = {"protected_namespaces": ()}

    model_name: str
    accuracy: float
    mae: float
    rmse: float
    is_winner: bool


class PipelineJobAccepted(BaseModel):
    job_id: str
    status: str
    message: str


class PipelineJobStatus(BaseModel):
    job_id: str
    status: Literal["queued", "running", "completed", "failed"]
    created_at: str
    updated_at: str
    progress_pct: Optional[int] = None
    current_step: Optional[str] = None
    error: Optional[str] = None


class PipelineJobResult(PipelineJobStatus):
    model_config = {"protected_namespaces": ()}

    winner_model: Optional[str] = None
    model_results: Optional[list[ModelResult]] = None
    forecast_data: Optional[list[dict]] = None  # [{date, predicted}]
    filename: Optional[str] = None


class PipelineJobListItem(BaseModel):
    job_id: str
    filename: str
    status: str
    created_at: str
    winner_model: Optional[str] = None
