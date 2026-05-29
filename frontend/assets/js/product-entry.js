const session = requireLogin();
const MIN_ROWS = 5;
const MIN_EMPTY_ROWS = 2;
const tbody = document.querySelector("#entryRows");
const form = document.querySelector("#entryForm");
const bulkDialog = document.querySelector("#bulkDialog");
const bulkText = document.querySelector("#bulkText");
const bulkOpen = document.querySelector("#bulkOpen");
const bulkCancel = document.querySelector("#bulkCancel");
const bulkApply = document.querySelector("#bulkApply");
const alertDialog = document.querySelector("#alertDialog");
const alertText = document.querySelector("#alertText");
const alertOk = document.querySelector("#alertOk");

function getFirstShelfValue() {
  return tbody.querySelector("tr:first-child input[data-field='shelf']")?.value.trim() || "";
}

function rowIsEmpty(row) {
  return ["name", "color", "quantity"].every((field) => !row.querySelector(`[data-field="${field}"]`).value.trim());
}

function getEmptyRowCount() {
  return [...tbody.querySelectorAll("tr")].filter(rowIsEmpty).length;
}

function makeRow() {
  const isFirstRow = tbody.children.length === 0;
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input data-field="name" placeholder="布料名称" /></td>
    <td><input data-field="color" placeholder="颜色" /></td>
    <td><input data-field="quantity" inputmode="decimal" placeholder="数量" /></td>
    <td><input data-field="shelf" placeholder="货架" /></td>
    <td><button class="btn danger row-remove" type="button">×</button></td>
  `;

  const shelfInput = tr.querySelector("[data-field='shelf']");
  if (!isFirstRow) {
    shelfInput.value = getFirstShelfValue();
    shelfInput.dataset.autoShelf = "true";
  }

  tr.addEventListener("input", (event) => {
    event.target.classList?.remove("field-error");
    if (event.target.dataset.field === "shelf") {
      if (tr === tbody.firstElementChild) {
        syncBlankShelfRows();
      } else {
        event.target.dataset.autoShelf = "false";
      }
    }
    ensureRows();
  });
  tr.querySelector(".row-remove").addEventListener("click", () => deleteRow(tr));
  return tr;
}

function clearRow(row) {
  row.querySelector("[data-field='name']").value = "";
  row.querySelector("[data-field='color']").value = "";
  row.querySelector("[data-field='quantity']").value = "";
  row.querySelectorAll(".field-error").forEach((input) => input.classList.remove("field-error"));
  const shelfInput = row.querySelector("[data-field='shelf']");
  if (row === tbody.firstElementChild) {
    shelfInput.value = "";
  } else {
    shelfInput.value = getFirstShelfValue();
    shelfInput.dataset.autoShelf = "true";
  }
}

function fillRow(row, item) {
  row.querySelector("[data-field='name']").value = item.name || "";
  row.querySelector("[data-field='color']").value = item.color || "";
  row.querySelector("[data-field='quantity']").value = item.quantity || "";
  const shelfInput = row.querySelector("[data-field='shelf']");
  shelfInput.value = item.shelf || getFirstShelfValue();
  shelfInput.dataset.autoShelf = item.shelf ? "false" : "true";
}

function deleteRow(row) {
  if (tbody.children.length > MIN_ROWS) {
    row.remove();
  } else {
    clearRow(row);
  }
  ensureRows();
  syncBlankShelfRows();
}

function ensureRows() {
  while (tbody.children.length < MIN_ROWS || getEmptyRowCount() < MIN_EMPTY_ROWS) {
    tbody.appendChild(makeRow());
  }
}

function syncBlankShelfRows() {
  const firstShelf = getFirstShelfValue();
  [...tbody.querySelectorAll("tr")].slice(1).forEach((row) => {
    const shelfInput = row.querySelector("[data-field='shelf']");
    if (!shelfInput.value.trim() || shelfInput.dataset.autoShelf === "true") {
      shelfInput.value = firstShelf;
      shelfInput.dataset.autoShelf = "true";
    }
  });
}

function getFilledRows() {
  return [...tbody.querySelectorAll("tr")]
    .map((row) => {
      const value = (field) => row.querySelector(`[data-field="${field}"]`).value.trim();
      return {
        name: value("name"),
        color: value("color"),
        quantity: value("quantity"),
        shelf: value("shelf"),
      };
    })
    .filter((item) => item.name || item.color || item.quantity);
}

function clearValidationErrors() {
  tbody.querySelectorAll(".field-error").forEach((input) => input.classList.remove("field-error"));
}

function validateRows() {
  clearValidationErrors();
  const requiredFields = ["name", "color", "quantity", "shelf"];
  let hasIncompleteRow = false;
  [...tbody.querySelectorAll("tr")].forEach((row) => {
    const shelfInput = row.querySelector("[data-field='shelf']");
    const hasProductValue = ["name", "color", "quantity"].some((field) =>
      row.querySelector(`[data-field="${field}"]`).value.trim()
    );
    const hasManualShelf = shelfInput.value.trim() && shelfInput.dataset.autoShelf !== "true";
    const hasAnyValue = hasProductValue || hasManualShelf;
    if (!hasAnyValue) return;
    requiredFields.forEach((field) => {
      const input = row.querySelector(`[data-field="${field}"]`);
      if (!input.value.trim()) {
        input.classList.add("field-error");
        hasIncompleteRow = true;
      }
    });
  });
  return !hasIncompleteRow;
}

function parseChineseNumber(text) {
  const digits = {
    零: 0,
    〇: 0,
    一: 1,
    二: 2,
    两: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
  };
  const rawValue = text.trim();
  const digitPattern = Object.keys(digits).join("");
  const meterMixedMatch = rawValue.match(new RegExp(`^(\\d+)[米码]([0-9${digitPattern}]+)$`));
  if (meterMixedMatch) {
    const decimal = [...meterMixedMatch[2]].map((char) => digits[char] ?? char).join("");
    return `${meterMixedMatch[1]}.${decimal}`;
  }
  const chineseMeterMixedMatch = rawValue.match(new RegExp(`^([${digitPattern}])[米码]([0-9${digitPattern}]+)$`));
  if (chineseMeterMixedMatch) {
    const decimal = [...chineseMeterMixedMatch[2]].map((char) => digits[char] ?? char).join("");
    return `${digits[chineseMeterMixedMatch[1]]}.${decimal}`;
  }
  const value = rawValue.replace(/[米码]/g, "").trim();
  if (/^\d+(\.\d+)?$/.test(value)) {
    return value;
  }
  const mixedMatch = value.match(new RegExp(`^(\\d+)(?:点([0-9${digitPattern}]+)|([0-9${digitPattern}]))$`));
  if (mixedMatch) {
    const decimalText = mixedMatch[2] || mixedMatch[3] || "";
    const decimal = [...decimalText].map((char) => digits[char] ?? char).join("");
    return `${mixedMatch[1]}.${decimal}`;
  }
  const meterMatch = value.match(new RegExp(`^([${digitPattern}])(?:点([${digitPattern}]+)|([${digitPattern}]))?$`));
  if (!meterMatch) {
    return value;
  }
  const integer = digits[meterMatch[1]];
  const decimalText = meterMatch[2] || meterMatch[3] || "";
  const decimal = [...decimalText].map((char) => digits[char]).join("");
  return decimal ? `${integer}.${decimal}` : String(integer);
}

function normalizeQuantity(value) {
  return parseChineseNumber(value.trim());
}

function resetRows() {
  tbody.innerHTML = "";
  ensureRows();
}

function parseBulkText(text) {
  const rows = text
    .split(/\r\n|\n|\r|\u2028|\u2029/)
    .flatMap((line) => {
      const normalized = line.replace(/(\d)\.(\d)/g, "$1DECIMALDOT$2");
      const parts = normalized
        .split(/[\s!"#$%&'()*+,\-/:;<=>?@[\\\]^_`{|}~，。！？、；：“”‘’（）【】《》￥…—]+/u)
        .map((part) => part.replaceAll("DECIMALDOT", ".").trim())
        .filter(Boolean);
      const lineRows = [];
      for (let index = 0; index < parts.length; index += 3) {
        lineRows.push({
          name: parts[index] || "",
          color: parts[index + 1] || "",
          quantity: parts[index + 2] || "",
          shelf: "",
        });
      }
      return lineRows;
    });
  return rows.filter((item) => item.name || item.color || item.quantity);
}

function getFirstEmptyRowIndex() {
  return [...tbody.querySelectorAll("tr")].findIndex(rowIsEmpty);
}

function applyBulkRows(items) {
  const firstEmptyIndex = getFirstEmptyRowIndex();
  const startIndex = firstEmptyIndex === -1 ? tbody.children.length : firstEmptyIndex;
  while (tbody.children.length < startIndex + items.length + MIN_EMPTY_ROWS) {
    tbody.appendChild(makeRow());
  }
  items.forEach((item, index) => {
    fillRow(tbody.children[startIndex + index], item);
  });
  ensureRows();
  syncBlankShelfRows();
}

function openBulkDialog() {
  bulkDialog.hidden = false;
  bulkText.value = "";
  requestAnimationFrame(() => bulkText.focus());
}

function closeBulkDialog() {
  bulkDialog.hidden = true;
}

function showAlert(message) {
  alertText.textContent = message;
  alertDialog.hidden = false;
}

function closeAlert() {
  alertDialog.hidden = true;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validateRows()) {
    setMessage("#msg", "");
    showAlert("请补齐产品信息");
    return;
  }
  const rows = getFilledRows();
  if (!rows.length) {
    setMessage("#msg", "请至少填写一行", "error");
    return;
  }

  setMessage("#msg", "保存中...");
  try {
    for (const item of rows) {
      await request("/fabric-tails", {
        method: "POST",
        body: JSON.stringify({
          product_code: item.name,
          product_name: item.name,
          color: item.color,
          batch_no: item.shelf,
          tail_meters: normalizeQuantity(item.quantity || "0.01"),
          warehouse_location: "",
          remark: "",
        }),
      });
    }
    resetRows();
    setMessage("#msg", `录入成功：${rows.length} 行`, "ok");
  } catch (error) {
    setMessage("#msg", error.message, "error");
  }
});

bulkOpen?.addEventListener("click", openBulkDialog);
bulkCancel?.addEventListener("click", closeBulkDialog);
bulkDialog?.addEventListener("click", (event) => {
  if (event.target === bulkDialog) {
    closeBulkDialog();
  }
});
bulkApply?.addEventListener("click", () => {
  const items = parseBulkText(bulkText.value);
  if (!items.length) {
    setMessage("#msg", "请填写批量内容", "error");
    return;
  }
  applyBulkRows(items);
  closeBulkDialog();
  setMessage("#msg", `已填入：${items.length} 行`, "ok");
});
alertOk?.addEventListener("click", closeAlert);
alertDialog?.addEventListener("click", (event) => {
  if (event.target === alertDialog) {
    closeAlert();
  }
});

if (!session?.is_admin) {
  document.querySelector(".bottom-actions")?.classList.add("staff-actions");
}

ensureRows();
