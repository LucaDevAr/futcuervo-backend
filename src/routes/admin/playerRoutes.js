import express from "express";
import {
  getPlayers,
  createPlayer,
  getPlayerById,
  updatePlayer,
  deletePlayer,
} from "../../controllers/admin/playersController.js";

const router = express.Router();

// import { protect, isAdmin } from "../middlewares/authMiddleware.js";

router.get("/", getPlayers); // GET /api/admin/players
router.post("/", createPlayer); // POST /api/admin/players
router.get("/:id", getPlayerById); // GET /api/admin/players/:id
router.put("/:id", updatePlayer); // PUT /api/admin/players/:id
router.delete("/:id", deletePlayer); // DELETE /api/admin/players/:id

export default router;
