const form = document.querySelector("#loginForm");

function goAfterLogin(session) {
  location.href = session.is_admin ? "admin.html" : "home.html";
}

const existingSession = getSession();
if (existingSession && getToken()) {
  goAfterLogin(existingSession);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage("#msg", "登录中...");
  try {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: document.querySelector("#username").value.trim(),
        password: document.querySelector("#password").value,
      }),
    });
    saveSession(data);
    goAfterLogin(data);
  } catch (error) {
    setMessage("#msg", error.message, "error");
  }
});
