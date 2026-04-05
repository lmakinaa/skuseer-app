from pydantic import BaseModel
from typing import Literal


class Category(BaseModel):
    model_config = {"from_attributes": True}

    name: str
    products: int
    accuracy: float
    trend: Literal["up", "down", "stable"]


class SubcategoryResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    name: str


class CategoryResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    name: str
    products: int
    accuracy: float
    trend: Literal["up", "down", "stable"]
    subcategories: list[str] = []


class CategoryCreate(BaseModel):
    name: str


class CategoryUpdate(BaseModel):
    name: str | None = None


class SubcategoryCreate(BaseModel):
    name: str
