import Todo from "../models/Todo.js";
import { sendServerError } from "../utils/responseHelper.js";

// ---------- 1. GET TODOS (Excludes Soft-Deleted Tasks) ----------
export async function getTodos(req, res) {
  try {
    const userId = req.user.userId;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const filter = req.query.filter || "all";
    const search = req.query.search || "";

    // Always exclude soft-deleted tasks
    const query = { user: userId, isDeleted: false };

    if (search.trim() !== "") {
      query.title = { $regex: search.trim(), $options: "i" };
    }

    if (filter === "active") {
      query.completed = false;
    } else if (filter === "completed") {
      query.completed = true;
    }

    const totalTodos = await Todo.countDocuments(query);
    const totalPages = Math.ceil(totalTodos / limit) || 1;

    const todos = await Todo.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      todos,
      page,
      totalPages,
      totalTodos,
    });
  } catch (error) {
    sendServerError(res, error);
  }
}

// ---------- 2. CREATE A TASK (Checks Database for Duplicates) ----------
export async function createTodo(req, res) {
  try {
    const { title } = req.body;
    const userId = req.user.userId;

    const cleanTitle = title.trim();

    // Check if task already exists in database (case-insensitive)
    const existingTask = await Todo.findOne({
      user: userId,
      title: { $regex: `^${cleanTitle}$`, $options: "i" },
      isDeleted: false,
    });

    if (existingTask) {
      return res.status(400).json({
        success: false,
        message: "This task already exists in your list.",
      });
    }

    const newTodo = new Todo({
      title: cleanTitle,
      user: userId,
      isDeleted: false,
    });

    await newTodo.save();

    res.status(201).json({
      success: true,
      message: "Task added successfully!",
      todo: newTodo,
    });
  } catch (error) {
    sendServerError(res, error);
  }
}

// ---------- 3. UPDATE TASK TITLE ----------
export async function updateTodo(req, res) {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.user.userId;

    const cleanTitle = title.trim();

    // Check if another task already has this title
    const duplicate = await Todo.findOne({
      user: userId,
      _id: { $ne: id },
      title: { $regex: `^${cleanTitle}$`, $options: "i" },
      isDeleted: false,
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Another task already has this title.",
      });
    }

    const updatedTodo = await Todo.findOneAndUpdate(
      { _id: id, user: userId, isDeleted: false },
      { title: cleanTitle },
      { new: true }
    );

    if (!updatedTodo) {
      return res.status(404).json({ success: false, message: "Task not found." });
    }

    res.status(200).json({
      success: true,
      message: "Task updated!",
      todo: updatedTodo,
    });
  } catch (error) {
    sendServerError(res, error);
  }
}

// ---------- 4. TOGGLE TASK COMPLETED ----------
export async function toggleTodo(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const todo = await Todo.findOne({ _id: id, user: userId, isDeleted: false });
    if (!todo) {
      return res.status(404).json({ success: false, message: "Task not found." });
    }

    todo.completed = !todo.completed;
    await todo.save();

    res.status(200).json({
      success: true,
      message: "Task status updated!",
      todo,
    });
  } catch (error) {
    sendServerError(res, error);
  }
}

// ---------- 5. SOFT DELETE A TASK ----------
export async function deleteTodo(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Soft delete: sets isDeleted to true instead of removing from DB
    const todo = await Todo.findOneAndUpdate(
      { _id: id, user: userId, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!todo) {
      return res.status(404).json({ success: false, message: "Task not found." });
    }

    res.status(200).json({
      success: true,
      message: "Task deleted successfully (soft deleted)!",
    });
  } catch (error) {
    sendServerError(res, error);
  }
}