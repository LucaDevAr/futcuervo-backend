import express from "express";
import { saveShirtGameAttempt } from "../../controllers/games/shirtController.js";
import { requireAuth } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// POST /api/games/shirt/save
router.post("/save", requireAuth, saveShirtGameAttempt);

export default router;
