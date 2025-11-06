import express from "express";
import { getAllDailyGames } from "../controllers/dailyGamesController.js";
import { clearDailyGamesCache } from "../services/cacheService.js";

const router = express.Router();

// @desc Get all daily games for all clubs (initial load)
// @route GET /api/games/daily/all
router.get("/all", getAllDailyGames);

// @desc Clear daily games cache manually
// @route POST /api/games/daily/reset-cache
router.post("/reset-cache", async (req, res) => {
  try {
    await clearDailyGamesCache();
    res.json({ success: true, message: "Daily games cache cleared" });
  } catch (err) {
    console.error("[v0] Error clearing daily games cache:", err);
    res
      .status(500)
      .json({ success: false, message: "Error clearing daily games cache" });
  }
});

export default router;
