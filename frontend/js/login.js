// If already logged in, redirect to correct dashboard
if (getToken()) {
  if (getRole() === "admin") {
    window.location.href = "admin.html";
  } else {
    window.location.href = "dashboard.html";
  }
}

document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("errorMsg");
  const loginBtn = document.getElementById("loginBtn");

  errorMsg.classList.add("hidden");
  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";

  try {
    const data = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    }).then((r) => r.json().then((d) => ({ ok: r.ok, ...d })));

    if (!data.ok) {
      throw new Error(data.message || "Login failed");
    }

    // Save token and role
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("userName", data.name);

    // Redirect based on role
    if (data.role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "dashboard.html";
    }
  } catch (err) {
    errorMsg.textContent = err.message;
    errorMsg.classList.remove("hidden");
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
  }
});
