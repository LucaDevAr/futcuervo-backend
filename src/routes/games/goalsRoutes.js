import express from "express";
import { saveGoalsGameAttempt } from "../../controllers/games/goalsController.js";
import { requireAuth } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// POST /api/games/goals/save
router.post("/save", requireAuth, saveGoalsGameAttempt);

export default router;
