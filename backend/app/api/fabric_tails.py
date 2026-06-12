from datetime import date, datetime, time
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select

from app.api.deps import DbSession, get_current_user, require_admin
from app.models.fabric_tail import FabricTail, FabricTailDeleteLog
from app.models.user import User
from app.schemas.fabric_tail import FabricTailCreate, FabricTailHistoryOut, FabricTailHistoryRow, FabricTailOut, FabricTailPage


router = APIRouter(prefix="/fabric-tails", tags=["尾部小米数"])


def normalize_search_text(value: str) -> str:
    return "".join(char.lower() for char in value if char.isalnum())


@router.post("", response_model=FabricTailOut, status_code=201)
def create_fabric_tail(
    payload: FabricTailCreate,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> FabricTail:
    if not current_user.warehouse:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="当前账号未绑定仓库，不能录入库存")
    values = payload.model_dump()
    values["warehouse_location"] = current_user.warehouse
    item = FabricTail(**values, created_by=current_user.id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("", response_model=FabricTailPage)
def search_fabric_tails(
    db: DbSession,
    _: Annotated[User, Depends(get_current_user)],
    keyword: str = "",
    page: int = 1,
    page_size: int = 20,
) -> FabricTailPage:
    page = max(page, 1)
    page_size = min(max(page_size, 1), 200)
    offset = (page - 1) * page_size
    stmt = select(FabricTail).order_by(FabricTail.id.desc())
    if keyword:
        like = f"%{keyword}%"
        stmt = stmt.where(
            or_(
                FabricTail.product_code.ilike(like),
                FabricTail.product_name.ilike(like),
                FabricTail.color.ilike(like),
                FabricTail.batch_no.ilike(like),
                FabricTail.warehouse_location.ilike(like),
            )
        )
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = list(db.scalars(stmt.offset(offset).limit(page_size)))
    if keyword and total == 0:
        normalized_keyword = normalize_search_text(keyword)
        all_items = list(db.scalars(select(FabricTail).order_by(FabricTail.id.desc())))
        normalized_items = [
            item
            for item in all_items
            if normalized_keyword
            and normalized_keyword
            in normalize_search_text(
                f"{item.product_code}{item.product_name}{item.color}{item.batch_no}{item.warehouse_location}"
            )
        ]
        total = len(normalized_items)
        items = normalized_items[offset : offset + page_size]
    return FabricTailPage(total=total, page=page, page_size=page_size, items=items)


@router.get("/history", response_model=FabricTailHistoryOut)
def fabric_tail_history(
    db: DbSession,
    _: Annotated[User, Depends(require_admin)],
    start_date: date | None = None,
    end_date: date | None = None,
    warehouse: str = "",
    action: str = "",
) -> FabricTailHistoryOut:
    if action not in {"", "created", "deleted"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="分类参数不正确")
    start_dt = datetime.combine(start_date, time.min) if start_date else None
    end_dt = datetime.combine(end_date, time.max) if end_date else None

    summary: dict[tuple[str, str], dict[str, int]] = {}
    created_total = 0
    deleted_total = 0
    if action in {"", "created"}:
        created_stmt = select(
            func.date(FabricTail.created_at).label("day"),
            FabricTail.warehouse_location.label("warehouse"),
            func.count(FabricTail.id).label("count"),
        )
        if start_dt:
            created_stmt = created_stmt.where(FabricTail.created_at >= start_dt)
        if end_dt:
            created_stmt = created_stmt.where(FabricTail.created_at <= end_dt)
        if warehouse:
            created_stmt = created_stmt.where(FabricTail.warehouse_location == warehouse)
        created_stmt = created_stmt.group_by("day", FabricTail.warehouse_location)
        for day, row_warehouse, count in db.execute(created_stmt):
            key = (str(day), row_warehouse or "-")
            summary.setdefault(key, {"created": 0, "deleted": 0})["created"] = count
            created_total += count
    if action in {"", "deleted"}:
        deleted_stmt = select(
            func.date(FabricTailDeleteLog.deleted_at).label("day"),
            FabricTailDeleteLog.warehouse_location.label("warehouse"),
            func.count(FabricTailDeleteLog.id).label("count"),
        )
        if start_dt:
            deleted_stmt = deleted_stmt.where(FabricTailDeleteLog.deleted_at >= start_dt)
        if end_dt:
            deleted_stmt = deleted_stmt.where(FabricTailDeleteLog.deleted_at <= end_dt)
        if warehouse:
            deleted_stmt = deleted_stmt.where(FabricTailDeleteLog.warehouse_location == warehouse)
        deleted_stmt = deleted_stmt.group_by("day", FabricTailDeleteLog.warehouse_location)
        for day, row_warehouse, count in db.execute(deleted_stmt):
            key = (str(day), row_warehouse or "-")
            summary.setdefault(key, {"created": 0, "deleted": 0})["deleted"] = count
            deleted_total += count

    rows = [
        FabricTailHistoryRow(
            date=day,
            warehouse=row_warehouse,
            created_count=values["created"],
            deleted_count=values["deleted"],
        )
        for (day, row_warehouse), values in sorted(summary.items(), reverse=True)
    ]
    return FabricTailHistoryOut(created_total=created_total, deleted_total=deleted_total, rows=rows)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fabric_tail(
    item_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    item = db.get(FabricTail, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="库存不存在")
    db.add(
        FabricTailDeleteLog(
            fabric_tail_id=item.id,
            product_code=item.product_code,
            product_name=item.product_name,
            color=item.color,
            batch_no=item.batch_no,
            warehouse_location=item.warehouse_location,
            tail_meters=item.tail_meters,
            unit=item.unit,
            created_by=item.created_by,
            deleted_by=current_user.id,
            original_created_at=item.created_at,
        )
    )
    db.delete(item)
    db.commit()
