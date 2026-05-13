const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["credit", "payment"], required: true },
    // credit = took goods on credit (amount owed goes up)
    // payment = paid back money (amount owed goes down)
    amount: { type: Number, required: true },
    note: { type: String, default: "" },
    addedBy: { type: String, default: "user" }, // "user" or "admin_approval"
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
