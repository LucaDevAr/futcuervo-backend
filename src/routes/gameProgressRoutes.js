import express from "express";
import {
  getGameProgress,
  postGameProgress,
} from "../controllers/gameProgressController.js";

const router = express.Router();

router.get("/game-progress", getGameProgress);
router.post("/game-progress", postGameProgress);

export default router;
