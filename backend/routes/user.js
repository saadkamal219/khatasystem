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

module.exports = router;
