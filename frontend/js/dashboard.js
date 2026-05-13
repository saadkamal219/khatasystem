requireLogin();
if (getRole() === "admin") window.location.href = "admin.html";

let userData = {};
let userTransactions = [];

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("userName").textContent =
    localStorage.getItem("userName") || "User";
  loadDashboard();
  loadRequests();
});

async function loadDashboard() {
  try {
    const data = await apiRequest("/user/dashboard");
    userData = data.user;
    userTransactions = data.transactions;

    const remaining = Math.max(0, userData.totalCredit - userData.totalPaid);
    document.getElementById("totalCredit").textContent = formatAmount(userData.totalCredit);
    document.getElementById("totalPaid").textContent   = formatAmount(userData.totalPaid);
    document.getElementById("remaining").textContent   = formatAmount(remaining);

    renderTransactions(userTransactions);
  } catch (err) {
    document.getElementById("transactionList").innerHTML =
      `<p class="empty-state"><span class="empty-state-icon">⚠️</span><br><span class="empty-state-text">${err.message}</span></p>`;
  }
}

function renderTransactions(transactions) {
  const container = document.getElementById("transactionList");
  if (!transactions.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-text">No approved transactions yet</div>
      </div>`;
    return;
  }
  container.innerHTML = transactions.map(tx => `
    <div class="tx-item">
      <div class="tx-icon ${tx.type}">${tx.type === "credit" ? "📦" : "💵"}</div>
      <div class="tx-body">
        <div class="tx-type ${tx.type}">${tx.type === "credit" ? "Credit — Took Goods" : "Payment — Paid Back"}</div>
        ${tx.note ? `<div class="tx-note">${tx.note}</div>` : ""}
        <div class="tx-date">${formatDate(tx.createdAt)}</div>
      </div>
      <div class="tx-amount ${tx.type}">${tx.type === "credit" ? "+" : "−"}${formatAmount(tx.amount)}</div>
    </div>`).join("");
}

async function loadRequests() {
  try {
    const data = await apiRequest("/edit-request/my-requests");
    renderRequests(data.requests);
  } catch (err) {
    document.getElementById("requestList").innerHTML =
      `<p class="empty-state"><span class="empty-state-text">${err.message}</span></p>`;
  }
}

function renderRequests(requests) {
  const container = document.getElementById("requestList");
  if (!requests.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📬</div>
        <div class="empty-state-text">No requests submitted yet</div>
      </div>`;
    return;
  }
  container.innerHTML = requests.map(r => `
    <div class="req-item">
      <div class="req-body">
        <div class="req-type">${r.type === "credit" ? "📦 Credit" : "💵 Payment"} — ${formatAmount(r.amount)}</div>
        ${r.note ? `<div class="req-meta">Note: ${r.note}</div>` : ""}
        ${r.adminNote ? `<div class="req-admin-note">Shop owner: ${r.adminNote}</div>` : ""}
        <div class="req-date">${formatDate(r.createdAt)}</div>
      </div>
      <span class="badge badge-${r.status}">${r.status}</span>
    </div>`).join("");
}

// ---- Modal ----
function openRequestModal(type) {
  document.getElementById("reqType").value = type;
  document.getElementById("requestModalTitle").textContent =
    type === "credit" ? "Took Goods on Credit" : "Made a Payment";
  document.getElementById("requestModalSub").textContent =
    type === "credit" ? "Request to add credit entry" : "Request to record a payment";
  document.getElementById("reqAmount").value = "";
  document.getElementById("reqNote").value = "";
  document.getElementById("reqError").classList.add("hidden");
  document.getElementById("requestModal").classList.remove("hidden");
  setTimeout(() => document.getElementById("reqAmount").focus(), 100);
}

function closeRequestModal() {
  document.getElementById("requestModal").classList.add("hidden");
}

async function submitRequest() {
  const type   = document.getElementById("reqType").value;
  const amount = document.getElementById("reqAmount").value;
  const note   = document.getElementById("reqNote").value.trim();
  const errEl  = document.getElementById("reqError");

  errEl.classList.add("hidden");
  if (!amount || Number(amount) <= 0) {
    errEl.textContent = "Please enter a valid amount";
    errEl.classList.remove("hidden");
    return;
  }

  try {
    await apiRequest("/edit-request/submit", "POST", { type, amount: Number(amount), note });
    closeRequestModal();
    loadRequests();
    showToast("Request submitted — waiting for approval");
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove("hidden");
  }
}

// ---- PDF ----
function downloadPDF() {
  const name      = userData.name || localStorage.getItem("userName") || "User";
  const phone     = userData.phone || "";
  const credit    = userData.totalCredit || 0;
  const paid      = userData.totalPaid   || 0;
  const remaining = Math.max(0, credit - paid);
  const date      = new Date().toLocaleDateString("en-BD", { day:"numeric", month:"long", year:"numeric" });

  let txRows = userTransactions.length === 0
    ? `<tr><td colspan="4" style="text-align:center;padding:24px;color:#888">No transactions yet</td></tr>`
    : userTransactions.map((tx, i) => {
        const c    = tx.type === "credit" ? "#dc2626" : "#15803d";
        const sign = tx.type === "credit" ? "+" : "−";
        return `<tr style="background:${i%2===0?"#fff":"#fafafa"}">
          <td style="padding:10px 14px;font-size:13px;color:#555">${formatDate(tx.createdAt)}</td>
          <td style="padding:10px 14px;font-weight:600;color:${c}">${tx.type === "credit" ? "Credit" : "Payment"}</td>
          <td style="padding:10px 14px;color:#555;font-size:13px">${tx.note || "—"}</td>
          <td style="padding:10px 14px;font-weight:700;color:${c};text-align:right;font-family:monospace">${sign}৳${Number(tx.amount).toLocaleString()}</td>
        </tr>`;
      }).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <title>Statement — ${name}</title>
    <style>
      body{font-family:'Segoe UI',sans-serif;padding:40px;color:#1c1917;background:#fff}
      h1{font-size:24px;font-weight:800;margin-bottom:4px;letter-spacing:-0.5px}
      .sub{color:#78716c;font-size:13px;margin-bottom:28px}
      .summary{display:flex;gap:16px;margin-bottom:28px;flex-wrap:wrap}
      .scard{padding:16px 20px;border-radius:10px;min-width:130px}
      .slabel{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px}
      .sval{font-size:22px;font-weight:800;font-family:monospace}
      table{width:100%;border-collapse:collapse;font-size:14px}
      th{background:#1c1917;color:#fff;padding:11px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.06em}
      th:last-child{text-align:right}
      tr{border-bottom:1px solid #f0ede9}
      .footer{margin-top:32px;font-size:11px;color:#aaa;text-align:center;border-top:1px solid #eee;padding-top:16px}
    </style></head><body>
    <h1>খ Khata — Account Statement</h1>
    <div class="sub">${name} &nbsp;·&nbsp; ${phone} &nbsp;·&nbsp; ${date}</div>
    <div class="summary">
      <div class="scard" style="background:#fef2f2;border:1px solid #fecaca">
        <div class="slabel" style="color:#dc2626">Total Credit</div>
        <div class="sval" style="color:#dc2626">৳${Number(credit).toLocaleString()}</div>
      </div>
      <div class="scard" style="background:#f0fdf4;border:1px solid #bbf7d0">
        <div class="slabel" style="color:#15803d">Total Paid</div>
        <div class="sval" style="color:#15803d">৳${Number(paid).toLocaleString()}</div>
      </div>
      <div class="scard" style="background:#eff6ff;border:1px solid #bfdbfe">
        <div class="slabel" style="color:#1d4ed8">Remaining</div>
        <div class="sval" style="color:#1d4ed8">৳${Number(remaining).toLocaleString()}</div>
      </div>
    </div>
    <table><thead><tr><th>Date</th><th>Type</th><th>Note</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>${txRows}</tbody></table>
    <div class="footer">Auto-generated by Khata Credit Management System</div>
    </body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, "_blank");
  if (win) win.onload = () => win.print();
}

// ---- Toast ----
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
  setTimeout(() => {
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 300);
  }, 2800);
}

document.addEventListener("click", e => {
  if (e.target.classList.contains("modal")) closeRequestModal();
});
