from pydantic import BaseModel
from typing import Literal


class ForecastModelSchema(BaseModel):
    model_config = {"from_attributes": True}

    name: str
    display_name: str
    accuracy: float
    status: Literal["active", "winner"]
    detail: str


class CategoryAccuracy(BaseModel):
    name: str
    accuracy: float
    products: int
