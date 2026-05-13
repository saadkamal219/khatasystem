const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },
    phone:       { type: String, required: true, unique: true },
    password:    { type: String, required: true },
    role:        { type: String, default: "user" },
    totalCredit: { type: Number, default: 0 },
    totalPaid:   { type: Number, default: 0 },

    // Profile fields
    address:     { type: String, default: "" },
    email:       { type: String, default: "" },
    note:        { type: String, default: "" }, // e.g. "regular customer"
    avatar:      { type: String, default: "" }, // base64 image string
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
