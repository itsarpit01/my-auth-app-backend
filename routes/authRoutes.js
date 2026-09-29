import express from "express";
import verifyToken from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import {signupSchema,loginSchema,updateProfileSchema, changePasswordSchema, deleteAccountSchema,} from "../utils/authValidators.js";
import { signup,login,getProfile,updateProfile,changePassword,deleteAccount,} from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.get("/profile", verifyToken, getProfile);
router.put("/update-profile", verifyToken, validate(updateProfileSchema), updateProfile);
router.put("/change-password", verifyToken, validate(changePasswordSchema), changePassword);
router.delete("/delete-account", verifyToken, validate(deleteAccountSchema), deleteAccount);

export default router;