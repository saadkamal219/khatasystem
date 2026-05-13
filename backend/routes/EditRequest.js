const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const EditRequest = require("../models/EditRequest");

// POST submit a new edit request (requires admin approval)
router.post("/submit", verifyToken, async (req, res) => {
  try {
    const { type, amount, note } = req.body;

    if (!type || !amount) {
      return res.status(400).json({ message: "Type and amount are required" });
    }
    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const request = new EditRequest({
      userId: req.user.id,
      type,
      amount: Number(amount),
      note: note || "",
    });
    await request.save();

    res.status(201).json({ message: "Request submitted, waiting for admin approval" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET user's own edit requests (to see status)
router.get("/my-requests", verifyToken, async (req, res) => {
  try {
    const requests = await EditRequest.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
