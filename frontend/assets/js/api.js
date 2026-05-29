const API_HOST = location.hostname || "localhost";
const API_BASE = location.port === "8000" ? `${location.origin}/api` : `http://${API_HOST}:8000/api`;

function getToken() {
  return localStorage.getItem("xiaomishu_token");
}

function getSession() {
  const raw = localStorage.getItem("xiaomishu_session");
  return raw ? JSON.parse(raw) : null;
}

function saveSession(data) {
  localStorage.setItem("xiaomishu_token", data.access_token);
  localStorage.setItem("xiaomishu_session", JSON.stringify(data));
}

function clearSession() {
  localStorage.removeItem("xiaomishu_token");
  localStorage.removeItem("xiaomishu_session");
}

function requireLogin(adminOnly = false) {
  const session = getSession();
  if (!session || !getToken()) {
    location.href = "login.html";
    return null;
  }
  if (adminOnly && !session.is_admin) {
    location.href = "home.html";
    return null;
  }
  return session;
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const contentType = response.headers.get("content-type") || "";
  const data =
    response.status === 204
      ? null
      : contentType.includes("application/json")
        ? await response.json()
        : await response.text();
  if (!response.ok) {
    const detail = data?.detail || data || "请求失败";
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg || item.message || JSON.stringify(item)).join("；")
      : typeof detail === "object"
        ? JSON.stringify(detail)
        : detail;
    throw new Error(message);
  }
  return data;
}

function bindLogout() {
  const btn = document.querySelector("[data-logout]");
  if (!btn) return;
  btn.addEventListener("click", () => {
    clearSession();
    location.href = "login.html";
  });
}

function setMessage(selector, text, type = "") {
  const el = document.querySelector(selector);
  if (!el) return;
  el.textContent = text;
  el.className = `message ${type}`.trim();
}
