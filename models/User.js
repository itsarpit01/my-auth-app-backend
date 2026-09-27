import mongoose from "mongoose";

// Yeh schema define karta hai ki har user ka data kaisa dikhega database me
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // koi bhi do users same email se nahi ban sakte
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt fields automatically add ho jayengi
    versionKey: false, // __v field ko disable kar deta hai
  }
);

const User = mongoose.model("User", userSchema);

export default User;