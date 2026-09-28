import mongoose from "mongoose";

const todoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // Connects every task to the logged-in user
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Todo = mongoose.model("Todo", todoSchema);

export default Todo;