// ---------- COMMON SERVER ERROR RESPONSE ----------
export function sendServerError(res, error) {
  console.error("Route error:", error);
  res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again later.",
  });
}