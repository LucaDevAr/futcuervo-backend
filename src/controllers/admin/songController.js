import Song from "../../models/Song.js";
import { deleteFromCloudinary } from "../../utils/cloudinary.js";

export const getAllSongs = async (req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });
    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: "Error fetching songs" });
  }
};

export const createSong = async (req, res) => {
  try {
    const { title, audioUrl, ...rest } = req.body;
    if (!title || !audioUrl)
      return res.status(400).json({ error: "Title and audioUrl are required" });
    const song = await Song.create({ title, audioUrl, ...rest });
    res.json({ success: true, song });
  } catch (error) {
    res.status(500).json({ error: "Failed to create song" });
  }
};

export const getSongById = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ error: "Song not found" });
    res.json(song);
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
};

export const updateSong = async (req, res) => {
  try {
    const data = req.body;
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ error: "Song not found" });
    // Eliminar archivos anteriores si fueron reemplazados
    if (
      data.coverPublicId &&
      song.coverPublicId &&
      data.coverPublicId !== song.coverPublicId
    ) {
      await deleteFromCloudinary(song.coverPublicId, "image");
    }
    if (
      data.audioPublicId &&
      song.audioPublicId &&
      data.audioPublicId !== song.audioPublicId
    ) {
      await deleteFromCloudinary(song.audioPublicId, "video");
    }
    const updated = await Song.findByIdAndUpdate(req.params.id, data, {
      new: true,
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Error updating song" });
  }
};

export const deleteSong = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ error: "Song not found" });
    if (song.coverPublicId)
      await deleteFromCloudinary(song.coverPublicId, "image");
    if (song.audioPublicId)
      await deleteFromCloudinary(song.audioPublicId, "video");
    await Song.findByIdAndDelete(req.params.id);
    res.json({ message: "Song deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting song" });
  }
};
