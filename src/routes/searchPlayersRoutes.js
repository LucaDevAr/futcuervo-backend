// routes/searchPlayersRoutes.js
import express from "express";
import { searchPlayers } from "../controllers/searchPlayersController.js";

const router = express.Router();

router.get("/search-players", searchPlayers);

export default router;
