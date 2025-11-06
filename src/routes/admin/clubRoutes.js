import express from "express";
import {
  getClubs,
  createClub,
  getClubById,
  updateClub,
  deleteClub,
} from "../../controllers/admin/clubController.js";

const router = express.Router();

// import { protect, isAdmin } from "../middlewares/authMiddleware.js";

router.get("/", getClubs); // GET /api/admin/clubs
router.post("/", createClub); // POST /api/admin/clubs
router.get("/:id", getClubById); // GET /api/admin/clubs/:id
router.put("/:id", updateClub); // PUT /api/admin/clubs/:id
router.delete("/:id", deleteClub); // DELETE /api/admin/clubs/:id

export default router;
