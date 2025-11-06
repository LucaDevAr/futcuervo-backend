import express from "express";
import {
  getCareerGames,
  createCareerGame,
  updateCareerGame,
  deleteCareerGame,
} from "../../controllers/careerGameController.js";
import { saveCareerGameAttempt } from "../../controllers/games/careerGameController.js";
import { requireAuth } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Solo admins pueden manejar career-games
router.route("/").get(getCareerGames).post(createCareerGame);

router.route("/:id").put(updateCareerGame).delete(deleteCareerGame);

router.post("/save", requireAuth, saveCareerGameAttempt);

export default router;
