import express from "express";
import { saveVideoGameAttempt } from "../../controllers/games/videoController.js";
import { requireAuth } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// POST /api/games/video/save
router.post("/save", requireAuth, saveVideoGameAttempt);

export default router;
