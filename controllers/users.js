const User = require("../models/user");
const nodemailer = require("nodemailer");

// In-memory OTP store (for demo)
const otpStore = {};

// Render Signup Page
module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup.ejs");
};

// SEND OTP API ===================
module.exports.sendOTP = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields required!" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "Email already registered!" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, username, password, createdAt: Date.now() };

    // Send OTP via email
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true if using 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "WanderLust OTP Verification",
      text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Error sending OTP!" });
  }
};

// SIGNUP ===================
module.exports.signup = async (req, res, next) => {
  try {
    const { username, email, password, otp } = req.body;
    const record = otpStore[email];

    if (!record) {
      req.flash("error", "No OTP found for this email. Please get OTP again.");
      return res.redirect("/signup");
    }

    // Expiry check
    if (Date.now() - record.createdAt > 5 * 60 * 1000) {
      delete otpStore[email];
      req.flash("error", "OTP expired. Please get a new one.");
      return res.redirect("/signup");
    }

    if (record.otp !== otp) {
      req.flash("error", "Invalid OTP!");
      return res.redirect("/signup");
    }

    // Create user
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);

    delete otpStore[email];

    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome to WanderLust!");
      res.redirect("/listings");
    });
  } catch (e) {
    console.error(e);
    req.flash("error", "Signup failed!");
    res.redirect("/signup");
  }
};

//LOGIN / LOGOUT ===================
module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.login = (req, res) => {
  req.flash("success", "Welcome back!");
  const redirectUrl = req.session.redirectUrl || "/listings";
  delete req.session.redirectUrl;
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "You are logged out!");
    res.redirect("/listings");
  });
};
