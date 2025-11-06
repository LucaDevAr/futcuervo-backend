import express from "express";
import {
  getHistoryGames,
  createHistoryGame,
  updateHistoryGame,
  deleteHistoryGame,
} from "../../controllers/games/historyGameController.js";
// import { protect, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.route("/").get(getHistoryGames).post(createHistoryGame);

router.route("/:id").put(updateHistoryGame).delete(deleteHistoryGame);

export default router;
