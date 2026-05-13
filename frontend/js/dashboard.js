requireLogin();
if (getRole() === "admin") window.location.href = "admin.html";

let currentTxType = "credit";

// Load dashboard on page load
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("userName").textContent =
    localStorage.getItem("userName") || "User";
  loadDashboard();
  loadRequests();
});

// Fetch and render user dashboard data
async function loadDashboard() {
  try {
    const data = await apiRequest("/user/dashboard");
    const { user, transactions } = data;

    // Update summary cards
    document.getElementById("totalCredit").textContent = formatAmount(user.totalCredit);
    document.getElementById("totalPaid").textContent = formatAmount(user.totalPaid);
    const remaining = user.totalCredit - user.totalPaid;
    document.getElementById("remaining").textContent = formatAmount(
      remaining > 0 ? remaining : 0
    );

    // Render transaction list
    renderTransactions(transactions, "transactionList");
  } catch (err) {
    document.getElementById("transactionList").innerHTML =
      `<p class="empty-msg" style="color:red">${err.message}</p>`;
  }
}

// Render a list of transactions into a target element
function renderTransactions(transactions, targetId) {
  const container = document.getElementById(targetId);
  if (!transactions.length) {
    container.innerHTML = '<p class="empty-msg">No transactions yet</p>';
    return;
  }

  container.innerHTML = transactions
    .map(
      (tx) => `
    <div class="tx-item">
      <div class="tx-left">
        <div class="tx-type ${tx.type}">${tx.type === "credit" ? "Credit (Took Goods)" : "Payment (Paid Back)"}</div>
        ${tx.note ? `<div class="tx-note">${tx.note}</div>` : ""}
        <div class="tx-date">${formatDate(tx.createdAt)}</div>
      </div>
      <div class="tx-amount ${tx.type}">${tx.type === "credit" ? "+" : "-"}${formatAmount(tx.amount)}</div>
    </div>
  `
    )
    .join("");
}

// Load user's edit requests
async function loadRequests() {
  try {
    const data = await apiRequest("/edit-request/my-requests");
    renderRequests(data.requests);
  } catch (err) {
    document.getElementById("requestList").innerHTML =
      `<p class="empty-msg" style="color:red">${err.message}</p>`;
  }
}

function renderRequests(requests) {
  const container = document.getElementById("requestList");
  if (!requests.length) {
    container.innerHTML = '<p class="empty-msg">No requests submitted</p>';
    return;
  }

  container.innerHTML = requests
    .map(
      (r) => `
    <div class="req-item">
      <div class="req-left">
        <div class="req-type">${r.type === "credit" ? "Credit" : "Payment"} — ${formatAmount(r.amount)}</div>
        ${r.note ? `<div class="req-note">Note: ${r.note}</div>` : ""}
        ${r.adminNote ? `<div class="req-admin-note">Admin note: ${r.adminNote}</div>` : ""}
        <div class="req-date">${formatDate(r.createdAt)}</div>
      </div>
      <span class="badge badge-${r.status}">${r.status}</span>
    </div>
  `
    )
    .join("");
}

// ---- Modal: Add Transaction ----
function openModal(type) {
  currentTxType = type;
  document.getElementById("modalTitle").textContent =
    type === "credit" ? "Add Credit (Took Goods)" : "Add Payment (Paid Back)";
  document.getElementById("txAmount").value = "";
  document.getElementById("txNote").value = "";
  document.getElementById("txError").classList.add("hidden");
  document.getElementById("transactionModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("transactionModal").classList.add("hidden");
}

async function submitTransaction() {
  const amount = document.getElementById("txAmount").value;
  const note = document.getElementById("txNote").value.trim();
  const txError = document.getElementById("txError");
  const btn = document.getElementById("txSubmitBtn");

  txError.classList.add("hidden");

  if (!amount || Number(amount) <= 0) {
    txError.textContent = "Please enter a valid amount";
    txError.classList.remove("hidden");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Saving...";

  try {
    await apiRequest("/user/transaction", "POST", {
      type: currentTxType,
      amount: Number(amount),
      note,
    });
    closeModal();
    loadDashboard();
  } catch (err) {
    txError.textContent = err.message;
    txError.classList.remove("hidden");
  } finally {
    btn.disabled = false;
    btn.textContent = "Add";
  }
}

// ---- Modal: Request Edit ----
function openRequestModal() {
  document.getElementById("reqAmount").value = "";
  document.getElementById("reqNote").value = "";
  document.getElementById("reqError").classList.add("hidden");
  document.getElementById("requestModal").classList.remove("hidden");
}

function closeRequestModal() {
  document.getElementById("requestModal").classList.add("hidden");
}

async function submitRequest() {
  const type = document.getElementById("reqType").value;
  const amount = document.getElementById("reqAmount").value;
  const note = document.getElementById("reqNote").value.trim();
  const reqError = document.getElementById("reqError");

  reqError.classList.add("hidden");

  if (!amount || Number(amount) <= 0) {
    reqError.textContent = "Please enter a valid amount";
    reqError.classList.remove("hidden");
    return;
  }

  try {
    await apiRequest("/edit-request/submit", "POST", {
      type,
      amount: Number(amount),
      note,
    });
    closeRequestModal();
    loadRequests();
    alert("Request submitted! Waiting for admin approval.");
  } catch (err) {
    reqError.textContent = err.message;
    reqError.classList.remove("hidden");
  }
}

// Close modals on outside click
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("modal")) {
    closeModal();
    closeRequestModal();
  }
});
