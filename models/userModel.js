const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  clerkUserId: {
    type: String,
    required: true,
    unique: true
  },

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  role: {
    type: String,
    enum: ["customer", "staff", "admin"],
    default: "customer"
  },

  phone: String,

  specialization: {
    type: String,
    required: function () {
      return this.role === "staff";
    }
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema);
