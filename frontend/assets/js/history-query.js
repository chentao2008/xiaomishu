requireLogin(true);
bindLogout();

const form = document.querySelector("#historyForm");
const startDate = document.querySelector("#startDate");
const endDate = document.querySelector("#endDate");
const warehouse = document.querySelector("#warehouse");
const actionType = document.querySelector("#actionType");
const rows = document.querySelector("#historyRows");
const createdTotal = document.querySelector("#createdTotal");
const deletedTotal = document.querySelector("#deletedTotal");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function todayText() {
  return new Date().toISOString().slice(0, 10);
}

function buildHistoryUrl() {
  const params = [];
  if (startDate.value) params.push(`start_date=${encodeURIComponent(startDate.value)}`);
  if (endDate.value) params.push(`end_date=${encodeURIComponent(endDate.value)}`);
  if (warehouse.value) params.push(`warehouse=${encodeURIComponent(warehouse.value)}`);
  if (actionType.value) params.push(`action=${encodeURIComponent(actionType.value)}`);
  return `/fabric-tails/history?${params.join("&")}`;
}

function renderRows(items) {
  if (!items.length) {
    rows.innerHTML = `<tr><td colspan="4">暂无数据</td></tr>`;
    return;
  }
  rows.innerHTML = items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.date)}</td>
          <td>${escapeHtml(item.warehouse)}</td>
          <td>${escapeHtml(item.created_count)}</td>
          <td>${escapeHtml(item.deleted_count)}</td>
        </tr>
      `
    )
    .join("");
}

async function loadHistory() {
  setMessage("#msg", "查询中...");
  try {
    const result = await request(buildHistoryUrl());
    createdTotal.textContent = String(result.created_total || 0);
    deletedTotal.textContent = String(result.deleted_total || 0);
    renderRows(result.rows || []);
    setMessage("#msg", "");
  } catch (error) {
    setMessage("#msg", error.message, "error");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await loadHistory();
});

const today = todayText();
if (!startDate.value) startDate.value = today;
if (!endDate.value) endDate.value = today;
loadHistory();
