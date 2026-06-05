const session = requireLogin();
const PAGE_SIZE = 20;
const cards = document.querySelector("#stockCards");
const emptyState = document.querySelector("#emptyState");
const pager = document.querySelector("#pager");
const prevPage = document.querySelector("#prevPage");
const nextPage = document.querySelector("#nextPage");
const pageInfo = document.querySelector("#pageInfo");
const deleteDialog = document.querySelector("#deleteDialog");
const deleteText = document.querySelector("#deleteText");
const deleteCancel = document.querySelector("#deleteCancel");
const deleteConfirm = document.querySelector("#deleteConfirm");
let currentPage = 1;
let totalItems = 0;
let pendingDelete = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

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
      (item) => {
        const productName = escapeHtml(item.product_name);
        const color = escapeHtml(item.color || "-");
        const warehouse = escapeHtml(item.warehouse_location || "-");
        const unit = escapeHtml(item.unit);
        const batchNo = escapeHtml(item.batch_no || "-");
        return `
        <article class="stock-card">
          <div class="stock-card-content">
            <div class="stock-card-title">${productName}</div>
            <div class="stock-card-grid">
              <span>颜色</span><strong>${color}</strong><span>仓库</span><strong>${warehouse}</strong>
              <span>数量</span><strong>${escapeHtml(item.tail_meters)}${unit}</strong><span>货架</span><strong>${batchNo}</strong>
            </div>
            <div class="stock-time-row">
              <span class="stock-time-label">录入时间</span><strong class="stock-time">${formatCreatedAt(item.created_at)}</strong>
            </div>
          </div>
          <button class="stock-delete" type="button" data-id="${item.id}" data-name="${productName}" aria-label="删除库存">×</button>
        </article>
      `;
      }
    )
    .join("");
}

function openDeleteDialog(id, name, button) {
  pendingDelete = { id, button };
  deleteText.textContent = `确认删除${name || "这条库存"}吗？`;
  deleteDialog.hidden = false;
  deleteConfirm.disabled = false;
}

function closeDeleteDialog() {
  pendingDelete = null;
  deleteDialog.hidden = true;
  deleteConfirm.disabled = false;
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
    if (totalItems > 1 && cards.children.length === 1 && currentPage > 1) {
      currentPage -= 1;
    }
    await search(currentPage);
    return true;
  } catch (error) {
    if (error.message === "库存不存在") {
      setMessage("#msg", "已删除", "ok");
      await search(currentPage);
      return true;
    }
    if (button) {
      button.disabled = false;
    }
    setMessage("#msg", error.message, "error");
    return false;
  }
}

function renderPager(total, page, pageSize) {
  totalItems = total;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  pager.hidden = total <= pageSize;
  pageInfo.textContent = `${page} / ${totalPages}`;
  prevPage.disabled = page <= 1;
  nextPage.disabled = page >= totalPages;
}

async function search(page = 1) {
  const keyword = document.querySelector("#keyword").value.trim();
  currentPage = Math.max(page, 1);
  setMessage("#msg", "");
  try {
    const result = await request(
      `/fabric-tails?keyword=${encodeURIComponent(keyword)}&page=${currentPage}&page_size=${PAGE_SIZE}`
    );
    const items = result.items || [];
    if (!items.length && result.total && currentPage > 1) {
      return search(currentPage - 1);
    }
    renderRows(items);
    renderPager(result.total || 0, result.page || currentPage, result.page_size || PAGE_SIZE);
    if (result.total) {
      setMessage("#msg", `共 ${result.total} 条库存`, "ok");
    }
  } catch (error) {
    setMessage("#msg", error.message, "error");
  }
}

document.querySelector("#searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  search(1);
});

cards.addEventListener("click", (event) => {
  const button = event.target.closest(".stock-delete");
  if (!button) return;
  openDeleteDialog(button.dataset.id, button.dataset.name, button);
});

deleteCancel?.addEventListener("click", closeDeleteDialog);

deleteConfirm?.addEventListener("click", async () => {
  if (!pendingDelete || deleteConfirm.disabled) return;
  deleteConfirm.disabled = true;
  const deleted = await deleteStock(pendingDelete.id, pendingDelete.button);
  if (deleted) {
    closeDeleteDialog();
  } else {
    deleteConfirm.disabled = false;
  }
});

deleteDialog?.addEventListener("click", (event) => {
  if (event.target === deleteDialog) {
    closeDeleteDialog();
  }
});

prevPage.addEventListener("click", () => {
  if (currentPage > 1) {
    search(currentPage - 1);
  }
});

nextPage.addEventListener("click", () => {
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  if (currentPage < totalPages) {
    search(currentPage + 1);
  }
});

search();
