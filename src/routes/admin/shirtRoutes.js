import express from "express";
import {
  getShirts,
  createShirt,
  getShirtById,
  updateShirt,
  deleteShirt,
} from "../../controllers/admin/shirtController.js";

const router = express.Router();

// import { protect, isAdmin } from "../middlewares/authMiddleware.js";

router.get("/", getShirts); // GET /api/admin/shirts
router.post("/", createShirt); // POST /api/admin/shirts
router.get("/:id", getShirtById); // GET /api/admin/shirts/:id
router.put("/:id", updateShirt); // PUT /api/admin/shirts/:id
router.delete("/:id", deleteShirt); // DELETE /api/admin/shirts/:id

export default router;
