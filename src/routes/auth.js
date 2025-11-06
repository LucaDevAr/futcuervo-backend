import express from "express";
import passport from "passport";
import {
  register,
  login,
  logout,
  getSession,
  googleCallback,
} from "../controllers/authController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Rutas de autenticación local
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/session", requireAuth, getSession);

// Rutas de Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  googleCallback
);

export default router;
