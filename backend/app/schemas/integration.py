from pydantic import BaseModel
from typing import Literal


class IntegrationResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    name: str
    description: str
    provider: str
    status: Literal["connected", "disconnected"]
    last_sync: str   # human-readable: "2 min ago", "Never"
    data_points: str
    impact: str
