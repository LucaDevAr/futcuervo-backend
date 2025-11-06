import express from "express";
import {
  getPlayerGames,
  createPlayerGame,
  updatePlayerGame,
  deletePlayerGame,
} from "../../controllers/games/playerGameController.js";
// import { protect, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.route("/").get(getPlayerGames).post(createPlayerGame);

router.route("/:id").put(updatePlayerGame).delete(deletePlayerGame);

export default router;
