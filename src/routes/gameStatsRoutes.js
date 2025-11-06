import express from "express";
import {
  getUserLastAttempts,
  getAllUserAttempts, // New controller import
} from "../controllers/gameStatsController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { clearAllStatsCache } from "../services/cacheService.js";

const router = express.Router();

router.get("/all", requireAuth, getAllUserAttempts);

// Ruta protegida para obtener estadísticas del usuario
router.get("/last", requireAuth, getUserLastAttempts);

router.post("/reset-cache", async (req, res) => {
  try {
    await clearAllStatsCache();
    res.json({ success: true, message: "Stats cache cleared" });
  } catch (err) {
    console.error("[v0] Error clearing stats cache:", err);
    res
      .status(500)
      .json({ success: false, message: "Error clearing stats cache" });
  }
});

export default router;
