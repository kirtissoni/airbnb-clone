const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { isLoggedIn } = require("../middleware.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js"); // Cloudinary storage setup
const upload = multer({ storage });
const userController = require("../controllers/users.js");

// ================== Auth Routes ==================

// SignUp with OTP verification
router
  .route("/signup")
  .get(userController.renderSignupForm)
  .post(wrapAsync(userController.signup));

// Send OTP API (AJAX)
router.post("/send-otp", wrapAsync(userController.sendOTP));

// Login
router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    (req, res) => {
      const redirectUrl = req.session.redirectUrl || "/listings";
      delete req.session.redirectUrl;
      req.flash("success", "Welcome back!");
      res.redirect(redirectUrl);
    }
  );

// Logout
router.get("/logout", userController.logout);

// ================== Profile Routes ==================

// View Profile
router.get("/profile", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.render("users/profile.ejs", { user });
  } catch (err) {
    req.flash("error", "Unable to load profile!");
    res.redirect("/");
  }
});

// Edit Profile Form
router.get("/profile/edit", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.render("users/editProfile.ejs", { user });
  } catch (err) {
    req.flash("error", "Unable to load edit profile page!");
    res.redirect("/profile");
  }
});

// Handle Profile Edit
router.put(
  "/profile/edit",
  isLoggedIn,
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const { username, email, bio } = req.body;
      const updateData = { username, email, bio };
      if (req.file) {
        updateData.profileImage = req.file.path;
      }
      await User.findByIdAndUpdate(req.user._id, updateData, { new: true });
      req.flash("success", "Profile updated successfully!");
      res.redirect("/profile");
    } catch (err) {
      console.error(err);
      req.flash("error", "Unable to update profile!");
      res.redirect("/profile/edit");
    }
  }
);

module.exports = router;
