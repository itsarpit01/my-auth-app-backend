import jwt from "jsonwebtoken";
import User from "../models/User.js";

async function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided." });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Invalid or expired token." });
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.isDeleted) {
      return res.status(401).json({ success: false, message: "Account not found or has been deleted." });
    }

    req.user = decoded;
    next();
  });
}

export default verifyToken;