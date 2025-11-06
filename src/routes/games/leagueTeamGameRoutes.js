import express from "express";
import { saveLeagueTeamAttempt } from "../../controllers/games/leagueTeamController.js";
import { requireAuth } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/save", requireAuth, saveLeagueTeamAttempt);

export default router;
