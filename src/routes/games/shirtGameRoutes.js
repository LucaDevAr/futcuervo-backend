import express from "express";
import {
  getShirtGames,
  createShirtGame,
  updateShirtGame,
  deleteShirtGame,
} from "../../controllers/games/shirtGameController.js";
// import { protect, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.route("/").get(getShirtGames).post(createShirtGame);

router.route("/:id").put(updateShirtGame).delete(deleteShirtGame);

export default router;
