import express from "express";
import {
  getAllPlayers,
  getPlayersByClubId,
} from "../controllers/playersController.js";
import { clearPlayersCache } from "../services/cacheService.js";

const router = express.Router();

// GET /api/players?clubId=xxx
router.get("/", getAllPlayers); // GET /api/admin/players
router.get("/by-club-id", getPlayersByClubId); // GET /api/admin/players/by-club-id?clubId=xxx

// POST /api/players/reset-cache  -> resetea todo el cache de jugadores
router.post("/reset-cache", async (req, res) => {
  const success = await clearPlayersCache();
  res.json({ success, message: "Players cache cleared" });
});

export default router;
