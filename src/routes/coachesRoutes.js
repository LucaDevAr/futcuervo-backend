import express from "express";
import {
  getAllCoaches,
  getCoachById,
  getCoachesByClubId,
} from "../controllers/coachesController.js";
import { clearCoachesCache } from "../services/cacheService.js";

const router = express.Router();

// GET /api/coaches - Get all coaches
router.get("/", getAllCoaches);

// GET /api/coaches/by-club-id?clubId=xxx - Get coaches by club ID
router.get("/by-club-id", getCoachesByClubId);

// GET /api/coaches/:id - Get single coach by ID
router.get("/:id", getCoachById);

// POST /api/coaches/reset-cache - Clear coaches cache
router.post("/reset-cache", async (req, res) => {
  const success = await clearCoachesCache();
  res.json({ success, message: "Coaches cache cleared" });
});

export default router;
