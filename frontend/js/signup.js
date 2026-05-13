document.getElementById("signupForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("errorMsg");
  const successMsg = document.getElementById("successMsg");
  const signupBtn = document.getElementById("signupBtn");

  errorMsg.classList.add("hidden");
  successMsg.classList.add("hidden");

  if (password.length < 6) {
    errorMsg.textContent = "Password must be at least 6 characters";
    errorMsg.classList.remove("hidden");
    return;
  }

  signupBtn.disabled = true;
  signupBtn.textContent = "Creating account...";

  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, password }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Signup failed");

    successMsg.textContent = "Account created! Redirecting to login...";
    successMsg.classList.remove("hidden");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  } catch (err) {
    errorMsg.textContent = err.message;
    errorMsg.classList.remove("hidden");
    signupBtn.disabled = false;
    signupBtn.textContent = "Create Account";
  }
});
