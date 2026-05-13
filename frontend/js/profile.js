requireLogin();
if (getRole() === "admin") window.location.href = "admin.html";

let currentAvatar = "";

window.addEventListener("DOMContentLoaded", loadProfile);

async function loadProfile() {
  try {
    const data = await apiRequest("/user/profile");
    const u = data.user;
    currentAvatar = u.avatar || "";

    // Fill form
    document.getElementById("fieldName").value    = u.name    || "";
    document.getElementById("fieldPhone").value   = u.phone   || "";
    document.getElementById("fieldEmail").value   = u.email   || "";
    document.getElementById("fieldAddress").value = u.address || "";
    document.getElementById("fieldNote").value    = u.note    || "";

    // Hero
    document.getElementById("heroName").textContent  = u.name;
    document.getElementById("heroPhone").textContent = u.phone;

    // Avatar
    updateAvatarDisplay(u.name, u.avatar);
  } catch (err) {
    document.getElementById("profileError").textContent = err.message;
    document.getElementById("profileError").classList.remove("hidden");
  }
}

function updateAvatarDisplay(name, avatarData) {
  const img      = document.getElementById("avatarImg");
  const initials = document.getElementById("avatarInitials");

  if (avatarData) {
    img.src = avatarData;
    img.classList.remove("hidden");
    initials.classList.add("hidden");
  } else {
    const parts = (name || "?").trim().split(" ");
    initials.textContent = parts.map(w => w[0]).join("").toUpperCase().slice(0, 2);
    img.classList.add("hidden");
    initials.classList.remove("hidden");
  }
}

function handleAvatarChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Warn if file is large
  if (file.size > 2 * 1024 * 1024) {
    alert("Please choose an image smaller than 2MB.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    currentAvatar = e.target.result; // base64 string
    updateAvatarDisplay("", currentAvatar);
  };
  reader.readAsDataURL(file);
}

async function saveProfile() {
  const name    = document.getElementById("fieldName").value.trim();
  const phone   = document.getElementById("fieldPhone").value.trim();
  const email   = document.getElementById("fieldEmail").value.trim();
  const address = document.getElementById("fieldAddress").value.trim();
  const note    = document.getElementById("fieldNote").value.trim();

  const errEl = document.getElementById("profileError");
  const sucEl = document.getElementById("profileSuccess");
  const btn   = document.getElementById("saveBtn");

  errEl.classList.add("hidden");
  sucEl.classList.add("hidden");

  if (!name || !phone) {
    errEl.textContent = "Name and phone number are required";
    errEl.classList.remove("hidden");
    return;
  }

  btn.disabled    = true;
  btn.textContent = "Saving...";

  try {
    const data = await apiRequest("/user/profile", "PUT", {
      name, phone, email, address, note, avatar: currentAvatar
    });

    // Update stored name in case it changed
    localStorage.setItem("userName", data.user.name);

    // Update hero
    document.getElementById("heroName").textContent  = data.user.name;
    document.getElementById("heroPhone").textContent = data.user.phone;
    updateAvatarDisplay(data.user.name, data.user.avatar);

    sucEl.textContent = "Profile updated successfully!";
    sucEl.classList.remove("hidden");

    setTimeout(() => sucEl.classList.add("hidden"), 3000);
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove("hidden");
  } finally {
    btn.disabled    = false;
    btn.textContent = "Save Changes";
  }
}
