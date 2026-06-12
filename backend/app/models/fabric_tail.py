from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class FabricTail(Base):
    __tablename__ = "fabric_tails"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    product_code: Mapped[str] = mapped_column(String(80), index=True)
    product_name: Mapped[str] = mapped_column(String(120), index=True)
    color: Mapped[str] = mapped_column(String(80), default="")
    batch_no: Mapped[str] = mapped_column(String(80), default="", index=True)
    warehouse_location: Mapped[str] = mapped_column(String(80), default="")
    tail_meters: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    unit: Mapped[str] = mapped_column(String(20), default="米")
    remark: Mapped[str] = mapped_column(Text, default="")
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    created_by_user = relationship("User", back_populates="fabrics")


class FabricTailDeleteLog(Base):
    __tablename__ = "fabric_tail_delete_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    fabric_tail_id: Mapped[int] = mapped_column(Integer, index=True)
    product_code: Mapped[str] = mapped_column(String(80), default="")
    product_name: Mapped[str] = mapped_column(String(120), default="")
    color: Mapped[str] = mapped_column(String(80), default="")
    batch_no: Mapped[str] = mapped_column(String(80), default="")
    warehouse_location: Mapped[str] = mapped_column(String(80), default="", index=True)
    tail_meters: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    unit: Mapped[str] = mapped_column(String(20), default="米")
    created_by: Mapped[int | None] = mapped_column(Integer, nullable=True)
    deleted_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    original_created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
