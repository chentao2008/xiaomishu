requireLogin(true);
bindLogout();

const rows = document.querySelector("#userRows");
const form = document.querySelector("#userForm");
const WAREHOUSES = ["贵阳", "成都", "南通"];

function userEditInput(user, field, value = "", type = "text", placeholder = "") {
  return `<input class="user-edit-input" data-edit="${field}" data-id="${user.id}" type="${type}" value="${value}" placeholder="${placeholder}" />`;
}

function passwordDisplayInput(user) {
  return `<input class="user-edit-input" type="text" value="${user.password || ""}" placeholder="无记录" readonly />`;
}

function warehouseSelect(user) {
  const current = user.warehouse || "";
  return `
    <select class="user-edit-input" data-edit="warehouse" data-id="${user.id}">
      ${WAREHOUSES.map((warehouse) => `<option value="${warehouse}" ${warehouse === current ? "selected" : ""}>${warehouse}</option>`).join("")}
    </select>
  `;
}

function renderUserRows(users) {
  if (!users.length) {
    rows.innerHTML = `<tr><td colspan="5">暂无账号</td></tr>`;
    return;
  }

  rows.innerHTML = users
    .map(
      (user) => `
        <tr>
          <td>${userEditInput(user, "username", user.username)}</td>
          <td>${passwordDisplayInput(user)}</td>
          <td>${warehouseSelect(user)}</td>
          <td>${user.is_admin ? "管理员" : "员工"}</td>
          <td>
            <button class="btn danger user-delete" type="button" data-id="${user.id}">删除</button>
          </td>
        </tr>
      `
    )
    .join("");
}

async function loadUsers() {
  const users = await request("/users");
  renderUserRows(users);
}

async function deleteUser(id, button) {
  if (!id || button?.disabled) return;
  button.disabled = true;
  setMessage("#msg", "删除中...");
  try {
    await request(`/users/${id}`, { method: "DELETE" });
    setMessage("#msg", "账号已删除", "ok");
    await loadUsers();
  } catch (error) {
    button.disabled = false;
    setMessage("#msg", error.message, "error");
  }
}

rows.addEventListener("click", (event) => {
  const deleteButton = event.target.closest(".user-delete");
  if (deleteButton) {
    deleteUser(deleteButton.dataset.id, deleteButton);
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage("#msg", "保存中...");
  try {
    await request("/users", {
      method: "POST",
      body: JSON.stringify({
        username: document.querySelector("#username").value.trim(),
        password: document.querySelector("#password").value,
        full_name: "",
        warehouse: document.querySelector("#warehouse").value.trim(),
        is_admin: document.querySelector("#role").value === "admin",
      }),
    });
    form.reset();
    setMessage("#msg", "账号已创建", "ok");
    await loadUsers();
  } catch (error) {
    setMessage("#msg", error.message, "error");
  }
});

loadUsers().catch((error) => {
  rows.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`;
  setMessage("#msg", error.message, "error");
});
