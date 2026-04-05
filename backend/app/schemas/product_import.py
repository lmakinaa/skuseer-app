from pydantic import BaseModel


class ProductImportResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    file: str
    date: str
    items: int
    status: str
