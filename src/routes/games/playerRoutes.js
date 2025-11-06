import express from "express";
import { savePlayerGameAttempt } from "../../controllers/games/playerController.js";
import { requireAuth } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// POST /api/games/shirt/save
router.post("/save", requireAuth, savePlayerGameAttempt);

export default router;
