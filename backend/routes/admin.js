const express = require("express");
const router = express.Router();
const { verifyAdmin } = require("../middleware/auth");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const EditRequest = require("../models/EditRequest");

// GET all users with their balances (admin overview)
router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("-password").sort({ name: 1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET one user's full transaction history
router.get("/user/:userId/transactions", verifyAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const transactions = await Transaction.find({ userId: req.params.userId }).sort({
      createdAt: -1,
    });

    res.json({ user, transactions });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET all pending edit requests
router.get("/edit-requests", verifyAdmin, async (req, res) => {
  try {
    const requests = await EditRequest.find({ status: "pending" })
      .populate("userId", "name phone")
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST approve an edit request
router.post("/edit-request/:id/approve", verifyAdmin, async (req, res) => {
  try {
    const request = await EditRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already handled" });
    }

    // Apply the transaction
    const user = await User.findById(request.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (request.type === "credit") {
      user.totalCredit += request.amount;
    } else {
      user.totalPaid += request.amount;
    }
    await user.save();

    // Save transaction record
    const transaction = new Transaction({
      userId: request.userId,
      type: request.type,
      amount: request.amount,
      note: request.note + " [Admin Approved]",
      addedBy: "admin_approval",
    });
    await transaction.save();

    // Mark request as approved
    request.status = "approved";
    await request.save();

    res.json({ message: "Request approved and transaction applied" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST reject an edit request
router.post("/edit-request/:id/reject", verifyAdmin, async (req, res) => {
  try {
    const { adminNote } = req.body;
    const request = await EditRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already handled" });
    }

    request.status = "rejected";
    request.adminNote = adminNote || "";
    await request.save();

    res.json({ message: "Request rejected" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
