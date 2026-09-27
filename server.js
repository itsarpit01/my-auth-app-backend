import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";

// .env file se environment variables load karo
dotenv.config();

const app = express();

// ---------- MIDDLEWARE ----------
app.use(cors()); // frontend (localhost:5173) ko backend se baat karne do
app.use(express.json()); // incoming JSON data ko parse karne ke liye

// ---------- ROUTES ----------
app.use("/api/auth", authRoutes);

// ---------- TEST ROUTE (confirm karne ke liye server chal raha hai) ----------
app.get("/", (req, res) => {
  res.send("Backend server is running!");
});

// ---------- MONGODB CONNECTION ----------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");

    // Database connect hone ke baad hi server start karo
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
  });