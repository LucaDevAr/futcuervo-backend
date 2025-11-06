// routes/searchCoachesRoutes.js
import express from "express";
import { searchCoaches } from "../controllers/searchCoachesController.js";

const router = express.Router();

router.get("/search-coaches", searchCoaches);

export default router;
