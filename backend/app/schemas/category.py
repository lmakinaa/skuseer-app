from pydantic import BaseModel
from typing import Literal


class Category(BaseModel):
    model_config = {"from_attributes": True}

    name: str
    products: int
    accuracy: float
    trend: Literal["up", "down", "stable"]
