from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select

from app.api.deps import DbSession, get_current_user
from app.models.fabric_tail import FabricTail
from app.models.user import User
from app.schemas.fabric_tail import FabricTailCreate, FabricTailOut


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


@router.get("", response_model=list[FabricTailOut])
def search_fabric_tails(
    db: DbSession,
    _: Annotated[User, Depends(get_current_user)],
    keyword: str = "",
    limit: int = 50,
) -> list[FabricTail]:
    stmt = select(FabricTail).order_by(FabricTail.id.desc()).limit(min(limit, 200))
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
    items = list(db.scalars(stmt))
    if keyword and not items:
        normalized_keyword = normalize_search_text(keyword)
        all_items = list(db.scalars(select(FabricTail).order_by(FabricTail.id.desc()).limit(min(limit, 200))))
        items = [
            item
            for item in all_items
            if normalized_keyword
            and normalized_keyword
            in normalize_search_text(
                f"{item.product_code}{item.product_name}{item.color}{item.batch_no}{item.warehouse_location}"
            )
        ]
    return items


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fabric_tail(
    item_id: int,
    db: DbSession,
    _: Annotated[User, Depends(get_current_user)],
) -> None:
    item = db.get(FabricTail, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="库存不存在")
    db.delete(item)
    db.commit()
