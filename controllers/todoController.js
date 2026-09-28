import Todo from "../models/Todo.js";
import { sendServerError } from "../utils/responseHelper.js";

// ---------- 1. GET TODOS (With Search, Filter & Pagination) ----------
export async function getTodos(req, res) {
  try {
    const userId = req.user.userId;

    // Query parameters with beginner-friendly defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const filter = req.query.filter || "all";
    const search = req.query.search || "";

    // Base query: only this user's tasks
    const query = { user: userId };

    // Search by title (case-insensitive)
    if (search.trim() !== "") {
      query.title = { $regex: search.trim(), $options: "i" };
    }

    // Filter by completion status
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

// ---------- 2. CREATE A TASK ----------
export async function createTodo(req, res) {
  try {
    const { title } = req.body;
    const userId = req.user.userId;

    if (!title || title.trim() === "") {
      return res.status(400).json({ success: false, message: "Task title cannot be empty." });
    }

    const newTodo = new Todo({
      title: title.trim(),
      user: userId,
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

// ---------- 3. UPDATE TASK TITLE (Inline Edit) ----------
export async function updateTodo(req, res) {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.user.userId;

    if (!title || title.trim() === "") {
      return res.status(400).json({ success: false, message: "Task title cannot be empty." });
    }

    const updatedTodo = await Todo.findOneAndUpdate(
      { _id: id, user: userId },
      { title: title.trim() },
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

    const todo = await Todo.findOne({ _id: id, user: userId });
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

// ---------- 5. DELETE A TASK ----------
export async function deleteTodo(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const todo = await Todo.findOneAndDelete({ _id: id, user: userId });
    if (!todo) {
      return res.status(404).json({ success: false, message: "Task not found." });
    }

    res.status(200).json({
      success: true,
      message: "Task deleted!",
    });
  } catch (error) {
    sendServerError(res, error);
  }
}