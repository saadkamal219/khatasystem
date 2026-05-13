requireAdmin();

let rejectingRequestId = null;
let currentDetailUserId = null;

window.addEventListener("DOMContentLoaded", () => {
  loadPendingRequests();
  loadAllUsers();
});

// ---- All Users ----
async function loadAllUsers() {
  try {
    const data = await apiRequest("/admin/users");
    renderUserList(data.users);
    const totalOwed = data.users.reduce((sum, u) => sum + Math.max(0, u.totalCredit - u.totalPaid), 0);
    document.getElementById("statUsers").textContent = data.users.length;
    document.getElementById("statOwed").textContent  = formatAmount(totalOwed);
  } catch (err) {
    document.getElementById("userList").innerHTML =
      `<div class="empty-state"><div class="empty-state-text" style="color:var(--red)">${err.message}</div></div>`;
  }
}

function renderUserList(users) {
  const container = document.getElementById("userList");
  if (!users.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👥</div>
        <div class="empty-state-text">No customers registered yet</div>
      </div>`;
    return;
  }
  container.innerHTML = users.map(u => {
    const remaining = Math.max(0, u.totalCredit - u.totalPaid);
    const initials  = u.name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2);
    const avatarHtml = u.avatar
      ? `<img src="${u.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:12px" />`
      : initials;
    return `
      <div class="user-row">
        <div class="user-avatar">${avatarHtml}</div>
        <div class="user-info">
          <div class="user-name">${u.name}</div>
          <div class="user-phone">${u.phone}</div>
        </div>
        <div class="user-balance">
          <div class="user-balance-amount">${formatAmount(remaining)}</div>
          <div class="user-balance-label">remaining</div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="viewUserDetail('${u._id}','${u.name}','${u.phone}','${u.avatar||''}')">View</button>
      </div>`;
  }).join("");
}

// ---- User Detail Modal ----
async function viewUserDetail(userId, userName, userPhone, avatarData) {
  currentDetailUserId = userId;
  const initials = userName.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2);

  // Set avatar
  const avatarEl = document.getElementById("detailAvatar");
  if (avatarData) {
    avatarEl.innerHTML = `<img src="${avatarData}" style="width:100%;height:100%;object-fit:cover;border-radius:14px" />`;
  } else {
    avatarEl.textContent = initials;
  }

  document.getElementById("detailUserName").textContent  = userName;
  document.getElementById("detailUserPhone").textContent = userPhone;

  // Reset to transactions tab
  switchTab("transactions");
  document.getElementById("detailCards").innerHTML = `<div class="loading-row" style="grid-column:1/-1"><div class="spinner"></div></div>`;
  document.getElementById("detailTransactions").innerHTML = "";
  document.getElementById("detailProfile").innerHTML = "";
  document.getElementById("userDetailModal").classList.remove("hidden");

  loadUserTransactions(userId);
}

async function loadUserTransactions(userId) {
  try {
    const { user, transactions } = await apiRequest(`/admin/user/${userId}/transactions`);
    const remaining = Math.max(0, user.totalCredit - user.totalPaid);

    document.getElementById("detailCards").innerHTML = `
      <div class="card card-red">
        <div class="card-label">Total Owed</div>
        <div class="card-amount">${formatAmount(user.totalCredit)}</div>
      </div>
      <div class="card card-green">
        <div class="card-label">Total Paid</div>
        <div class="card-amount">${formatAmount(user.totalPaid)}</div>
      </div>
      <div class="card card-blue">
        <div class="card-label">Remaining</div>
        <div class="card-amount">${formatAmount(remaining)}</div>
      </div>`;

    if (!transactions.length) {
      document.getElementById("detailTransactions").innerHTML =
        `<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">No transactions yet</div></div>`;
      return;
    }

    document.getElementById("detailTransactions").innerHTML = transactions.map(tx => `
      <div class="tx-item">
        <div class="tx-icon ${tx.type}">${tx.type === "credit" ? "📦" : "💵"}</div>
        <div class="tx-body">
          <div class="tx-type ${tx.type}">${tx.type === "credit" ? "Credit" : "Payment"}</div>
          ${tx.note ? `<div class="tx-note">${tx.note}</div>` : ""}
          <div class="tx-date">${formatDate(tx.createdAt)}</div>
        </div>
        <div class="tx-amount ${tx.type}">${tx.type === "credit" ? "+" : "−"}${formatAmount(tx.amount)}</div>
      </div>`).join("");
  } catch (err) {
    document.getElementById("detailCards").innerHTML =
      `<div style="color:var(--red);padding:12px;font-size:13px">${err.message}</div>`;
  }
}

async function loadUserProfile(userId) {
  const container = document.getElementById("detailProfile");
  container.innerHTML = `<div class="loading-row"><div class="spinner"></div></div>`;
  try {
    const { user } = await apiRequest(`/admin/user/${userId}/profile`);

    const field = (label, value) => `
      <div class="profile-field">
        <span class="profile-field-label">${label}</span>
        <span class="profile-field-value ${value ? "" : "empty"}">${value || "Not provided"}</span>
      </div>`;

    const avatarHtml = user.avatar
      ? `<img src="${user.avatar}" />`
      : user.name.trim().split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);

    container.innerHTML = `
      <div class="profile-view-card">
        <div class="profile-view-avatar">${avatarHtml}</div>
        <div class="profile-view-body">
          ${field("Name",    user.name)}
          ${field("Phone",   user.phone)}
          ${field("Email",   user.email)}
          ${field("Address", user.address)}
          ${field("Note",    user.note)}
          ${field("Joined",  formatDate(user.createdAt))}
        </div>
      </div>`;
  } catch (err) {
    container.innerHTML = `<div style="color:var(--red);padding:12px;font-size:13px">${err.message}</div>`;
  }
}

// ---- Tabs ----
function switchTab(tab) {
  document.getElementById("tabContentTransactions").classList.toggle("hidden", tab !== "transactions");
  document.getElementById("tabContentProfile").classList.toggle("hidden", tab !== "profile");
  document.getElementById("tabTransactions").classList.toggle("active", tab === "transactions");
  document.getElementById("tabProfile").classList.toggle("active", tab === "profile");

  if (tab === "profile" && currentDetailUserId) {
    loadUserProfile(currentDetailUserId);
  }
}

function closeDetailModal() {
  document.getElementById("userDetailModal").classList.add("hidden");
  currentDetailUserId = null;
}

// ---- Pending Requests ----
async function loadPendingRequests() {
  try {
    const data = await apiRequest("/admin/edit-requests");
    renderPendingRequests(data.requests);
    document.getElementById("statPending").textContent = data.requests.length;
  } catch (err) {
    document.getElementById("pendingRequests").innerHTML =
      `<div class="empty-state"><div class="empty-state-text" style="color:var(--red)">${err.message}</div></div>`;
  }
}

function renderPendingRequests(requests) {
  const container = document.getElementById("pendingRequests");
  if (!requests.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✅</div>
        <div class="empty-state-text">No pending requests</div>
      </div>`;
    return;
  }
  container.innerHTML = requests.map(r => `
    <div class="pending-card" id="req-${r._id}">
      <div class="pending-card-header">
        <div>
          <div class="pending-card-user">${r.userId?.name || "Unknown"}</div>
          <div class="pending-card-phone">${r.userId?.phone || ""}</div>
        </div>
        <span class="badge badge-pending">Pending</span>
      </div>
      <div class="pending-card-body">
        <div class="pending-card-type">
          ${r.type === "credit" ? "📦 Credit" : "💵 Payment"} — <strong>${formatAmount(r.amount)}</strong>
        </div>
        ${r.note ? `<div class="pending-card-note">Note: ${r.note}</div>` : ""}
        <div class="pending-card-date">${formatDate(r.createdAt)}</div>
      </div>
      <div class="pending-card-actions">
        <button class="btn btn-green btn-sm" onclick="approveRequest('${r._id}')">✓ Approve</button>
        <button class="btn btn-outline btn-sm" onclick="openRejectModal('${r._id}')">✕ Reject</button>
      </div>
    </div>`).join("");
}

async function approveRequest(requestId) {
  try {
    await apiRequest(`/admin/edit-request/${requestId}/approve`, "POST");
    loadPendingRequests();
    loadAllUsers();
    showToast("Request approved ✓");
  } catch (err) {
    alert("Error: " + err.message);
  }
}

function openRejectModal(requestId) {
  rejectingRequestId = requestId;
  document.getElementById("rejectNote").value = "";
  document.getElementById("rejectModal").classList.remove("hidden");
  setTimeout(() => document.getElementById("rejectNote").focus(), 100);
}

function closeRejectModal() {
  rejectingRequestId = null;
  document.getElementById("rejectModal").classList.add("hidden");
}

async function confirmReject() {
  const note = document.getElementById("rejectNote").value.trim();
  try {
    await apiRequest(`/admin/edit-request/${rejectingRequestId}/reject`, "POST", { adminNote: note });
    closeRejectModal();
    loadPendingRequests();
    showToast("Request rejected");
  } catch (err) {
    alert("Error: " + err.message);
  }
}

function showToast(msg) {
  const t = document.createElement("div");
  t.textContent = msg;
  Object.assign(t.style, {
    position:"fixed", bottom:"24px", left:"50%", transform:"translateX(-50%)",
    background:"#1c1917", color:"#fff", padding:"10px 20px", borderRadius:"24px",
    fontSize:"13px", fontWeight:"600", zIndex:"999", opacity:"0",
    transition:"opacity 0.2s", fontFamily:"Sora,sans-serif", whiteSpace:"nowrap",
    boxShadow:"0 8px 24px rgba(0,0,0,0.2)"
  });
  document.body.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = "1"; });
  setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 300); }, 2800);
}

document.addEventListener("click", e => {
  if (e.target.classList.contains("modal")) { closeDetailModal(); closeRejectModal(); }
});
