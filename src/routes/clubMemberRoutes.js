import express from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import {
  joinClub,
  leaveClub,
  getMyClubs,
} from "../controllers/clubMemberController.js";

const router = express.Router();

router.post("/join", requireAuth, joinClub);
router.post("/leave", requireAuth, leaveClub);
router.get("/mine", requireAuth, getMyClubs);

export default router;
