import express from "express";
import {
  getAllSongs,
  createSong,
  getSongById,
  updateSong,
  deleteSong,
} from "../../controllers/admin/songController.js";

const router = express.Router();

router.get("/", getAllSongs);
router.post("/", createSong);
router.get("/:id", getSongById);
router.put("/:id", updateSong);
router.delete("/:id", deleteSong);

export default router;
