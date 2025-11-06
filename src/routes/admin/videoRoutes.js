import express from "express";
import {
  getAllVideos,
  createVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
} from "../../controllers/admin/videoController.js";

const router = express.Router();

router.get("/", getAllVideos);
router.post("/", createVideo);
router.get("/:id", getVideoById);
router.patch("/:id", updateVideo);
router.delete("/:id", deleteVideo);

export default router;
