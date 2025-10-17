const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  bio: { type: String, default: "" },
  profileImage: {
    type: String,
    default: "https://cdn-icons-png.flaticon.com/512/847/847969.png",
  },
  // OTP and verification
  isVerified: { type: Boolean, default: false },
  emailOTP: String,
  otpExpires: Date,
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
