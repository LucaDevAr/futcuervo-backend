import express from "express";
import {
  getCareerGameByDate,
  getHistoryGameByDate,
  getPlayerGameByDate,
  getShirtGameByDate,
  getSongGameByDate,
  getVideoGameByDate,
} from "../controllers/publicGamesController.js";

const router = express.Router();

router.get("/career-game", getCareerGameByDate);
router.get("/history-game", getHistoryGameByDate);
router.get("/player-game", getPlayerGameByDate);
router.get("/shirt-game", getShirtGameByDate);
router.get("/song-game", getSongGameByDate);
router.get("/video-game", getVideoGameByDate);

export default router;
