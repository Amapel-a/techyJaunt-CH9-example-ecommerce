const User = require("../models/user.models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../../helpers/email");

const signUp = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });
    try {
      await sendEmail(
        newUser.email,
        `Welcome to ${process.env.APP_NAME || "TechyJaunt"}`,
        "welcome",
        {
          userName: `${newUser.firstName} ${newUser.lastName}`,
          text: `Welcome to ${process.env.APP_NAME || "TechyJaunt"}, ${newUser.firstName}! Your account is ready to use.`,
        },
      );
    } catch (emailError) {
      console.error("Failed to send signup welcome email:", emailError);
    }
    return res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: "User is not Verified" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid Password" });
    }
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

    await sendEmail(
      user.email,
      "A new login to your account",
      "emails/login-alert",
      {
        firstName: user.firstName,
        text: `A new login to your ${process.env.APP_NAME || "TechyJaunt"} account was successful. If this wasn't you, contact our support team.`,
      },
    );
    return res
      .status(200)
      .json({ message: "Login successful", user: user, token: token });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const sendOtp = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiresAt = Date.now() + 10 * 60 * 1000;
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    await sendEmail(
      user.email,
      "Verify your email address",
      "emails/verification-otp",
      {
        firstName: user.firstName,
        otp,
        text: `Your verification code is ${otp}. It expires in 10 minutes.`,
      },
    );
    return res.status(200).json({
      message: "OTP sent successfully",
      otp: otp,
      otpExpiresAt: otpExpiresAt,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const verifyOtp = async (req, res) => {
  const { otp } = req.body;
  try {
    const user = await User.findOne({ otp: otp });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (user.otpExpiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }
    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();
    return res.status(200).json({ message: "Email verified successfully" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const resendOtp = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiresAt = Date.now() + 10 * 60 * 1000;
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();
    return res.status(200).json({
      message: "OTP sent successfully",
      otp: otp,
      otpExpiresAt: otpExpiresAt,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (!user.isVerified) {
      return res.status(400).json({ message: "User is not verified" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiresAt = Date.now() + 10 * 60 * 1000;
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();
    return res.status(200).json({
      message: "OTP sent successfully",
      otp: otp,
      otpExpiresAt: otpExpiresAt,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const resetPassword = async (req, res) => {
  const { otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ otp: otp });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (user.otpExpiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();
    return res.status(200).json({ message: "Password reset successfully" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  signUp,
  login,
  sendOtp,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
};
