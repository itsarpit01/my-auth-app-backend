import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendServerError } from "../utils/responseHelper.js";

// ---------- SIGNUP ----------
export async function signup(req, res) {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ success: false, message: "This email is already registered." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ success: true, message: "Signup successful! Please login now." });
  } catch (error) {
    sendServerError(res, error);
  }
}

// ---------- LOGIN ----------
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ success: false, message: "Invalid email or password." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: "Invalid email or password." });

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
    sendServerError(res, error);
  }
}

// ---------- GET PROFILE ----------
export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user)
      return res.status(404).json({ success: false, message: "User not found." });

    res.status(200).json({ success: true, user: { name: user.name, email: user.email } });
  } catch (error) {
    sendServerError(res, error);
  }
}

// ---------- UPDATE PROFILE ----------
export async function updateProfile(req, res) {
  try {
    const { name, email } = req.body;

    const emailTaken = await User.findOne({ email, _id: { $ne: req.user.userId } });
    if (emailTaken)
      return res.status(400).json({ success: false, message: "This email is already in use by another account." });

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { name, email },
      { new: true }
    ).select("-password");

    if (!updatedUser)
      return res.status(404).json({ success: false, message: "User not found." });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      user: { name: updatedUser.name, email: updatedUser.email },
    });
  } catch (error) {
    sendServerError(res, error);
  }
}

// ---------- CHANGE PASSWORD ----------
export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found." });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: "Current password is incorrect." });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ success: true, message: "Password changed successfully!" });
  } catch (error) {
    sendServerError(res, error);
  }
}