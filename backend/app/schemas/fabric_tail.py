from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class FabricTailCreate(BaseModel):
    product_code: str = Field(..., min_length=1, max_length=80)
    product_name: str = Field(..., min_length=1, max_length=120)
    color: str = ""
    batch_no: str = ""
    warehouse_location: str = ""
    tail_meters: Decimal = Field(..., gt=0)
    unit: str = "米"
    remark: str = ""


class FabricTailOut(BaseModel):
    id: int
    product_code: str
    product_name: str
    color: str
    batch_no: str
    warehouse_location: str
    tail_meters: Decimal
    unit: str
    remark: str
    created_by: int | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

