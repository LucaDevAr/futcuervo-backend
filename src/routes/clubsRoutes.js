import express from "express";
import { getAllClubs } from "../controllers/clubsController.js";

const router = express.Router();

// Public route to get all clubs
router.get("/", getAllClubs); // GET /api/clubs

export default router;
