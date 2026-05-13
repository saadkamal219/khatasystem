const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" }, // "user" or "admin"
    totalCredit: { type: Number, default: 0 },  // total amount owed
    totalPaid: { type: Number, default: 0 },    // total amount paid back
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
