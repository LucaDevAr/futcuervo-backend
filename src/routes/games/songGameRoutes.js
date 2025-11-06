import express from "express";
import {
  getSongGames,
  createSongGame,
  getSongGameById,
  updateSongGame,
  updateSongGameClip,
  deleteSongGame,
} from "../../controllers/games/songGameController.js";
// import { protect, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.route("/").get(getSongGames).post(createSongGame);

router
  .route("/:id")
  .get(getSongGameById)
  .put(updateSongGame)
  .patch(updateSongGameClip)
  .delete(deleteSongGame);

export default router;
