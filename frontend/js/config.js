// ============================================
// CHANGE THIS TO YOUR RENDER BACKEND URL
// ============================================
const API_BASE = "https://your-app-name.onrender.com/api";

// Helper: get stored auth token
function getToken() {
  return localStorage.getItem("token");
}

// Helper: get stored user role
function getRole() {
  return localStorage.getItem("role");
}

// Helper: make authenticated API requests
async function apiRequest(endpoint, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// Helper: format date nicely
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Helper: format currency
function formatAmount(amount) {
  return "৳ " + Number(amount).toLocaleString("en-BD");
}

// Redirect if not logged in
function requireLogin() {
  if (!getToken()) {
    window.location.href = "index.html";
  }
}

// Redirect if not admin
function requireAdmin() {
  requireLogin();
  if (getRole() !== "admin") {
    window.location.href = "dashboard.html";
  }
}

// Logout
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}
