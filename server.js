import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import todoRoutes from "./routes/todoRoutes.js"; // 👈 1. Import
import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes); // 👈 2. Mount here

app.get("/", (req, res) => {
  res.send("Backend server is running!");
});

app.use(notFound);
app.use(errorHandler);

connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});