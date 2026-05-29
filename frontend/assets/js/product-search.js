const session = requireLogin();
const cards = document.querySelector("#stockCards");
const emptyState = document.querySelector("#emptyState");

function formatCreatedAt(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function renderRows(items) {
  if (!items.length) {
    cards.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";
  cards.innerHTML = items
    .map(
      (item) => `
        <article class="stock-card">
          <div class="stock-card-content">
            <div class="stock-card-title">${item.product_name}</div>
            <div class="stock-card-grid">
              <span>颜色</span><strong>${item.color || "-"}</strong><span>仓库</span><strong>${item.warehouse_location || "-"}</strong>
              <span>数量</span><strong>${item.tail_meters}${item.unit}</strong><span>货架</span><strong>${item.batch_no || "-"}</strong>
            </div>
            <div class="stock-time-row">
              <span class="stock-time-label">录入时间</span><strong class="stock-time">${formatCreatedAt(item.created_at)}</strong>
            </div>
          </div>
          <button class="stock-delete" type="button" data-id="${item.id}" aria-label="删除库存">×</button>
        </article>
      `
    )
    .join("");
}

async function deleteStock(id, button) {
  if (!id || button?.disabled) return;
  if (button) {
    button.disabled = true;
  }
  setMessage("#msg", "删除中...");
  try {
    await request(`/fabric-tails/${id}`, { method: "DELETE" });
    setMessage("#msg", "已删除", "ok");
    await search();
  } catch (error) {
    if (error.message === "库存不存在") {
      setMessage("#msg", "已删除", "ok");
      await search();
      return;
    }
    if (button) {
      button.disabled = false;
    }
    setMessage("#msg", error.message, "error");
  }
}

async function search() {
  const keyword = document.querySelector("#keyword").value.trim();
  setMessage("#msg", "");
  try {
    const items = await request(`/fabric-tails?keyword=${encodeURIComponent(keyword)}`);
    renderRows(items);
    if (items.length) {
      setMessage("#msg", `共 ${items.length} 条库存`, "ok");
    }
  } catch (error) {
    setMessage("#msg", error.message, "error");
  }
}

document.querySelector("#searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  search();
});

cards.addEventListener("click", (event) => {
  const button = event.target.closest(".stock-delete");
  if (!button) return;
  deleteStock(button.dataset.id, button);
});

search();
