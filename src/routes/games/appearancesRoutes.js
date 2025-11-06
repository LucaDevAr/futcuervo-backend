import express from "express";
import { saveAppearancesGameAttempt } from "../../controllers/games/appearancesController.js";
import { requireAuth } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
  console.log(`[v0] Appearances Route - ${req.method} ${req.path}`);
  next();
});

// Guardar intento de juego (requiere autenticación)
router.post("/save", requireAuth, saveAppearancesGameAttempt);

export default router;
