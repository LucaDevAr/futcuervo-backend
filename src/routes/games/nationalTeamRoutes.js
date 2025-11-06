import express from "express";
import { saveNationalGameAttempt } from "../../controllers/games/nationalTeamController.js";
import { requireAuth } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/save", requireAuth, saveNationalGameAttempt);

export default router;
