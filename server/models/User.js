const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String },
    profilePicture: { type: String, default: "" },
    lastLogin: { type: Date },
    role: {
      type: String,
      enum: ["guest", "subscriber", "writer", "editor", "administrator"],
      default: "guest",
    },
    subscriberExpiryDate: { type: Date },
    managedCategories: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
