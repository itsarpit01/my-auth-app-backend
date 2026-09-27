import jwt from "jsonwebtoken";

// Yeh middleware check karta hai ki request ke sath valid token hai ya nahi
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer TOKEN" format se token nikaalo

  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Invalid or expired token." });
    }
    req.user = decoded; // decoded data (userId, email) request me daal do agle steps ke liye
    next();
  });
}

export default verifyToken;