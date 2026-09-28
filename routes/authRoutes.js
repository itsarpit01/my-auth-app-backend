import express from "express";
import verifyToken from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import {
  signupSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "../utils/authValidators.js";
import {
  signup,
  login,
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.get("/profile", verifyToken, getProfile);
router.put("/update-profile", verifyToken, validate(updateProfileSchema), updateProfile);
router.put("/change-password", verifyToken, validate(changePasswordSchema), changePassword);

export default router;