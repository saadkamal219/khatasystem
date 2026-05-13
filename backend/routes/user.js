const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

// GET user dashboard data (balance + transaction history)
router.get("/dashboard", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const transactions = await Transaction.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });

    res.json({ user, transactions });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET user profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT update profile (name, phone, address, email, note, avatar)
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { name, phone, address, email, note, avatar } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required" });
    }

    // Check if new phone is already taken by someone else
    const existing = await User.findOne({ phone, _id: { $ne: req.user.id } });
    if (existing) {
      return res.status(400).json({ message: "Phone number already in use" });
    }

    // Validate avatar size (base64 ~1.3x actual size, limit to ~1MB image = ~1.4MB base64)
    if (avatar && avatar.length > 1500000) {
      return res.status(400).json({ message: "Image too large. Please use a smaller photo." });
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, address: address || "", email: email || "", note: note || "", avatar: avatar || "" },
      { new: true }
    ).select("-password");

    // Update the name in token payload reflection
    res.json({ message: "Profile updated", user: updated });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
