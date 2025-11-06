import express from "express";
import {
  getCoaches,
  createCoach,
  getCoachById,
  updateCoach,
  deleteCoach,
} from "../../controllers/admin/coachController.js";

const router = express.Router();

// import { protect, isAdmin } from "../middlewares/authMiddleware.js";

router.get("/", getCoaches); // GET /api/admin/coaches
router.post("/", createCoach); // POST /api/admin/coaches
router.get("/:id", getCoachById); // GET /api/admin/coaches/:id
router.put("/:id", updateCoach); // PUT /api/admin/coaches/:id
router.delete("/:id", deleteCoach); // DELETE /api/admin/coaches/:id

export default router;
