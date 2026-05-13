requireAdmin();

let rejectingRequestId = null;

window.addEventListener("DOMContentLoaded", () => {
  loadPendingRequests();
  loadAllUsers();
});

// ---- Load All Users ----
async function loadAllUsers() {
  try {
    const data = await apiRequest("/admin/users");
    renderUserList(data.users);
  } catch (err) {
    document.getElementById("userList").innerHTML =
      `<p class="empty-msg" style="color:red">${err.message}</p>`;
  }
}

function renderUserList(users) {
  const container = document.getElementById("userList");
  if (!users.length) {
    container.innerHTML = '<p class="empty-msg">No users registered yet</p>';
    return;
  }

  container.innerHTML = users
    .map((u) => {
      const remaining = Math.max(0, u.totalCredit - u.totalPaid);
      return `
      <div class="user-row">
        <div class="user-info-left">
          <div class="user-name">${u.name}</div>
          <div class="user-phone">${u.phone}</div>
        </div>
        <div class="user-balances">
          <div class="balance-item">
            <div class="balance-label">Owed</div>
            <div class="balance-value owed">${formatAmount(u.totalCredit)}</div>
          </div>
          <div class="balance-item">
            <div class="balance-label">Paid</div>
            <div class="balance-value paid">${formatAmount(u.totalPaid)}</div>
          </div>
          <div class="balance-item">
            <div class="balance-label">Remaining</div>
            <div class="balance-value remaining">${formatAmount(remaining)}</div>
          </div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="viewUserDetail('${u._id}', '${u.name}')">
          View History
        </button>
      </div>
    `;
    })
    .join("");
}

// ---- View User Detail Modal ----
async function viewUserDetail(userId, userName) {
  document.getElementById("detailUserName").textContent = userName + "'s Transactions";
  document.getElementById("detailCards").innerHTML = "Loading...";
  document.getElementById("detailTransactions").innerHTML = "";
  document.getElementById("userDetailModal").classList.remove("hidden");

  try {
    const data = await apiRequest(`/admin/user/${userId}/transactions`);
    const { user, transactions } = data;
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
      </div>
    `;

    if (!transactions.length) {
      document.getElementById("detailTransactions").innerHTML =
        '<p class="empty-msg">No transactions yet</p>';
      return;
    }

    document.getElementById("detailTransactions").innerHTML = transactions
      .map(
        (tx) => `
      <div class="tx-item">
        <div class="tx-left">
          <div class="tx-type ${tx.type}">${tx.type === "credit" ? "Credit" : "Payment"}</div>
          ${tx.note ? `<div class="tx-note">${tx.note}</div>` : ""}
          <div class="tx-date">${formatDate(tx.createdAt)}</div>
        </div>
        <div class="tx-amount ${tx.type}">${tx.type === "credit" ? "+" : "-"}${formatAmount(tx.amount)}</div>
      </div>
    `
      )
      .join("");
  } catch (err) {
    document.getElementById("detailCards").innerHTML =
      `<p class="empty-msg" style="color:red">${err.message}</p>`;
  }
}

function closeDetailModal() {
  document.getElementById("userDetailModal").classList.add("hidden");
}

// ---- Pending Edit Requests ----
async function loadPendingRequests() {
  try {
    const data = await apiRequest("/admin/edit-requests");
    renderPendingRequests(data.requests);
  } catch (err) {
    document.getElementById("pendingRequests").innerHTML =
      `<p class="empty-msg" style="color:red">${err.message}</p>`;
  }
}

function renderPendingRequests(requests) {
  const container = document.getElementById("pendingRequests");
  const section = document.getElementById("pendingSection");

  if (!requests.length) {
    container.innerHTML = '<p class="empty-msg">No pending requests</p>';
    return;
  }

  container.innerHTML = requests
    .map(
      (r) => `
    <div class="pending-req-item" id="req-${r._id}">
      <div class="pending-req-header">
        <span class="pending-req-user">${r.userId?.name || "Unknown"} (${r.userId?.phone || ""})</span>
        <span class="badge badge-pending">Pending</span>
      </div>
      <div class="pending-req-meta">
        ${r.type === "credit" ? "Credit" : "Payment"} of ${formatAmount(r.amount)}
      </div>
      ${r.note ? `<div class="pending-req-note">Note: ${r.note}</div>` : ""}
      <div class="tx-date" style="margin-bottom:10px">${formatDate(r.createdAt)}</div>
      <div class="pending-req-actions">
        <button class="btn btn-green btn-sm" onclick="approveRequest('${r._id}')">✓ Approve</button>
        <button class="btn btn-red btn-sm" onclick="openRejectModal('${r._id}')">✗ Reject</button>
      </div>
    </div>
  `
    )
    .join("");
}

async function approveRequest(requestId) {
  if (!confirm("Approve this request? The transaction will be applied.")) return;

  try {
    await apiRequest(`/admin/edit-request/${requestId}/approve`, "POST");
    loadPendingRequests();
    loadAllUsers();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

function openRejectModal(requestId) {
  rejectingRequestId = requestId;
  document.getElementById("rejectNote").value = "";
  document.getElementById("rejectModal").classList.remove("hidden");
}

function closeRejectModal() {
  rejectingRequestId = null;
  document.getElementById("rejectModal").classList.add("hidden");
}

async function confirmReject() {
  const note = document.getElementById("rejectNote").value.trim();
  try {
    await apiRequest(`/admin/edit-request/${rejectingRequestId}/reject`, "POST", {
      adminNote: note,
    });
    closeRejectModal();
    loadPendingRequests();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

// Close modals on outside click
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("modal")) {
    closeDetailModal();
    closeRejectModal();
  }
});
