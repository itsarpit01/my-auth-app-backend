
export function notFound(req, res) {
  res.status(404).json({ success: false, message: "Route not found." });
}

export function errorHandler(err, req, res, next) {
  console.error("Unexpected error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong on the server. Please try again later.",
  });
}