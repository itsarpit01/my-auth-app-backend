import express from "express";
import verifyToken from "../middleware/authMiddleware.js";
import {
  getTodos,
  createTodo,
  updateTodo,
  toggleTodo,
  deleteTodo,
} from "../controllers/todoController.js";

const router = express.Router();

router.get("/", verifyToken, getTodos);
router.post("/", verifyToken, createTodo);
router.put("/:id", verifyToken, updateTodo);
router.patch("/:id/toggle", verifyToken, toggleTodo);
router.delete("/:id", verifyToken, deleteTodo);

export default router;