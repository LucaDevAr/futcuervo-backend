import { Router } from "express";
import { getUserGameStatus } from "../controllers/gamesController.js";
const router = Router();

// GET /games/status/:userId
router.get("/status/:userId", getUserGameStatus);

export default router;
