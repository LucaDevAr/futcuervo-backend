// backend/routes/auth.js
import express from "express";
import {
  register,
  login,
  googleAuthRedirect,
  googleCallback,
  me,
  logout,
  refresh,
} from "../controllers/authController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// Google OAuth redirect & callback
router.get("/google", googleAuthRedirect);
router.get("/google/callback", googleCallback);

// session endpoints
router.get("/me", requireAuth, me);
router.post("/refresh", refresh); // optional

export default router;
