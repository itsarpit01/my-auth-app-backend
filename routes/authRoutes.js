import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User.js";

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
    {
      message: "Password must not contain your email",
      path: ["password"],
    }
  )
  .refine(
    (data) => !data.password.toLowerCase().includes(data.name.toLowerCase()),
    {
      message: "Password must not contain your name",
      path: ["password"],
    }
  );

// ---------- LOGIN VALIDATION SCHEMA ----------
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// ---------- SIGNUP ROUTE ----------
router.post("/signup", async (req, res) => {
  try {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
      const firstError = result.error.issues[0].message;
      return res.status(400).json({ success: false, message: firstError });
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
      const firstError = result.error.issues[0].message;
      return res.status(400).json({ success: false, message: firstError });
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

export default router;