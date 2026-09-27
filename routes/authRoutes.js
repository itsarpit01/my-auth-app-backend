import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User.js";
import verifyToken from "../middleware/authMiddleware.js";

const router = express.Router();

// ---------- SIGNUP VALIDATION SCHEMA (Strong) ----------
const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must not exceed 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please enter a valid email address")
      .max(100, "Email must not exceed 100 characters"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(64, "Password must not exceed 64 characters")
      .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
      .regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
      .regex(/[0-9]/, "Password must contain at least 1 number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least 1 special character")
      .regex(/^\S*$/, "Password must not contain spaces"),
  })
  .refine(
    (data) => !data.password.toLowerCase().includes(data.email.split("@")[0].toLowerCase()),
    { message: "Password must not contain your email", path: ["password"] }
  )
  .refine(
    (data) => !data.password.toLowerCase().includes(data.name.toLowerCase()),
    { message: "Password must not contain your name", path: ["password"] }
  );

// ---------- LOGIN VALIDATION SCHEMA ----------
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// ---------- UPDATE PROFILE VALIDATION SCHEMA ----------
const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address")
    .max(100, "Email must not exceed 100 characters"),
});

// ---------- CHANGE PASSWORD VALIDATION SCHEMA ----------
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password must not exceed 64 characters")
    .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
    .regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
    .regex(/[0-9]/, "Password must contain at least 1 number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least 1 special character")
    .regex(/^\S*$/, "Password must not contain spaces"),
});

// ---------- SIGNUP ROUTE ----------
router.post("/signup", async (req, res) => {
  try {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error.issues[0].message });
    }

    const { name, email, password } = result.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "This email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ success: true, message: "Signup successful! Please login now." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
});

// ---------- LOGIN ROUTE ----------
router.post("/login", async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error.issues[0].message });
    }

    const { email, password } = result.data;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      user: { name: user.name, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
});

// ---------- GET PROFILE ROUTE (Protected) ----------
router.get("/profile", verifyToken, async (req, res) => {
  try {
    // req.user middleware se aata hai (decoded token: { userId, email })
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.status(200).json({
      success: true,
      user: { name: user.name, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
});

// ---------- UPDATE PROFILE ROUTE (Protected) ----------
router.put("/update-profile", verifyToken, async (req, res) => {
  try {
    const result = updateProfileSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error.issues[0].message });
    }

    const { name, email } = result.data;

    // Agar naya email kisi aur account ka hai to reject karo
    const emailTaken = await User.findOne({ email, _id: { $ne: req.user.userId } });
    if (emailTaken) {
      return res.status(400).json({ success: false, message: "This email is already in use by another account." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { name, email },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      user: { name: updatedUser.name, email: updatedUser.email },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
});

// ---------- CHANGE PASSWORD ROUTE (Protected) ----------
router.put("/change-password", verifyToken, async (req, res) => {
  try {
    const result = changePasswordSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error.issues[0].message });
    }

    const { currentPassword, newPassword } = result.data;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect." });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ success: true, message: "Password changed successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
});

export default router;