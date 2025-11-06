import express from "express";
import {
  getAllLeagues,
  createLeague,
  getLeagueById,
  updateLeague,
  deleteLeague,
} from "../../controllers/admin/leaguesController.js";

const router = express.Router();

// import { protect, isAdmin } from "../middlewares/authMiddleware.js";

router.get("/", getAllLeagues); // GET /api/admin/leagues
router.post("/", createLeague); // POST /api/admin/leagues
router.get("/:id", getLeagueById); // GET /api/admin/leagues/:id
router.put("/:id", updateLeague); // PUT /api/admin/leagues/:id
router.delete("/:id", deleteLeague); // DELETE /api/admin/leagues/:id

export default router;
