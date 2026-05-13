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

// POST add a transaction (credit or payment)
// This directly updates the balance without admin approval
router.post("/transaction", verifyToken, async (req, res) => {
  try {
    const { type, amount, note } = req.body;

    if (!type || !amount) {
      return res.status(400).json({ message: "Type and amount are required" });
    }
    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }
    if (!["credit", "payment"].includes(type)) {
      return res.status(400).json({ message: "Type must be credit or payment" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update balances
    if (type === "credit") {
      user.totalCredit += Number(amount);
    } else {
      user.totalPaid += Number(amount);
    }
    await user.save();

    // Save the transaction record
    const transaction = new Transaction({
      userId: req.user.id,
      type,
      amount: Number(amount),
      note: note || "",
      addedBy: "user",
    });
    await transaction.save();

    res.json({ message: "Transaction added", transaction });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
