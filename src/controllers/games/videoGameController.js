import VideoGame from "../../models/VideoGame.js";
import Video from "../../models/Video.js";

// @desc Obtener todos los Video Games
// @route GET /api/admin/video-games
export const getVideoGames = async (req, res) => {
  try {
    const { clubId, generalOnly } = req.query;
    const filter = {};

    if (clubId) {
      filter.clubId = clubId;
    } else if (generalOnly === "true") {
      filter.$or = [{ clubId: null }, { clubId: { $exists: false } }];
    }

    const games = await VideoGame.find(filter)
      .populate("video")
      .populate("clubId")
      .sort({ date: 1 });

    res.json(games);
  } catch (error) {
    console.error("Error al obtener video games:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// @desc Crear Video Game
// @route POST /api/admin/video-games
export const createVideoGame = async (req, res) => {
  try {
    const {
      date,
      video,
      clipStart,
      clipEnd,
      answerStart,
      answerEnd,
      options,
      clubId,
    } = req.body;
    const normalizedDate = new Date(date);
    const normalizedClubId =
      !clubId || clubId === "null" || clubId === "" ? null : clubId;

    // 📌 Validar duplicado por fecha y club
    const existingByDate = await VideoGame.findOne({
      date: normalizedDate,
      ...(normalizedClubId
        ? { clubId: normalizedClubId }
        : { $or: [{ clubId: null }, { clubId: { $exists: false } }] }),
    });

    const correctOptions = options.filter((opt) => opt.isCorrect);
    if (correctOptions.length !== 1) {
      return res
        .status(400)
        .json({ error: "There must be exactly one correct option" });
    }

    if (existingByDate) {
      return res.status(400).json({
        error: "Ya existe un juego para esa fecha y club (o global).",
      });
    }

    const existingByVideo = await VideoGame.findOne({
      video,
      $or: [
        { clubId: normalizedClubId },
        // También se considera igual si ambos no tienen club
        ...(normalizedClubId
          ? []
          : [{ clubId: null }, { clubId: { $exists: false } }]),
      ],
    });

    if (existingByVideo) {
      return res.status(400).json({
        error:
          "Esa camiseta ya está asignada a un juego del mismo club (o global).",
      });
    }

    let game = await VideoGame.create({
      date: normalizedDate,
      video,
      clipStart: clipStart ?? 0,
      clipEnd: clipEnd ?? 10,
      answerStart: answerStart ?? 10,
      answerEnd: answerEnd ?? 20,
      options,
      clubId: normalizedClubId || null,
    });

    await game.populate([{ path: "video" }, { path: "clubId" }]);
    res.status(201).json(game);
  } catch (error) {
    console.error("Error updating video game:", error);
    res.status(500).json({ error: "Failed to update video game" });
  }
};

// @desc Obtener Video Game por ID
// @route GET /api/admin/video-games/:id
export const getVideoGameById = async (req, res) => {
  try {
    const { id } = req.params;
    const game = await VideoGame.findById(id);
    if (!game) return res.status(404).json({ error: "Video game not found" });

    const video = await Video.findById(game.video);

    res.json({
      _id: game._id,
      date: game.date,
      video,
      clipStart: game.clipStart,
      clipEnd: game.clipEnd,
      answerStart: game.answerStart,
      answerEnd: game.answerEnd,
      options: game.options || [],
    });
  } catch (error) {
    console.error("Error fetching video game:", error);
    res.status(500).json({ error: "Error fetching video game" });
  }
};

// @desc Actualizar Video Game
// @route PUT /api/admin/video-games/:id
export const updateVideoGame = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, video, clipStart, clipEnd, answerStart, answerEnd, options } =
      req.body;

    if (!date || !video)
      return res.status(400).json({ error: "Date and video are required" });

    if (options) {
      if (!Array.isArray(options) || options.length < 2)
        return res
          .status(400)
          .json({ error: "At least 2 options are required" });
      const correctOptions = options.filter((opt) => opt.isCorrect);
      if (correctOptions.length !== 1)
        return res
          .status(400)
          .json({ error: "There must be exactly one correct option" });
    }

    const updateData = { date, video };
    if (clipStart !== undefined) updateData.clipStart = clipStart;
    if (clipEnd !== undefined) updateData.clipEnd = clipEnd;
    if (answerStart !== undefined) updateData.answerStart = answerStart;
    if (answerEnd !== undefined) updateData.answerEnd = answerEnd;
    if (options) updateData.options = options;

    const updatedGame = await VideoGame.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!updatedGame)
      return res.status(404).json({ error: "Video game not found" });

    res.json({ success: true, videoGame: updatedGame });
  } catch (error) {
    console.error("Error updating video game:", error);
    res.status(500).json({ error: "Failed to update video game" });
  }
};

// @desc Actualizar solo clip y options
// @route PATCH /api/admin/video-games/:id
export const updateVideoGameClip = async (req, res) => {
  try {
    const { id } = req.params;
    const { clipStart, clipEnd, answerStart, answerEnd, options } = req.body;

    const updateData = {};
    if (clipStart !== undefined) updateData.clipStart = clipStart;
    if (clipEnd !== undefined) updateData.clipEnd = clipEnd;
    if (answerStart !== undefined) updateData.answerStart = answerStart;
    if (answerEnd !== undefined) updateData.answerEnd = answerEnd;
    if (options) {
      if (!Array.isArray(options) || options.length < 2)
        return res
          .status(400)
          .json({ error: "At least 2 options are required" });
      const correctOptions = options.filter((opt) => opt.isCorrect);
      if (correctOptions.length !== 1)
        return res
          .status(400)
          .json({ error: "There must be exactly one correct option" });
      updateData.options = options;
    }

    const updatedGame = await VideoGame.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!updatedGame)
      return res.status(404).json({ error: "Video game not found" });

    res.json({ success: true, videoGame: updatedGame });
  } catch (error) {
    console.error("Error updating video game:", error);
    res.status(500).json({ error: "Failed to update video game" });
  }
};

// @desc Eliminar Video Game
// @route DELETE /api/admin/video-games/:id
export const deleteVideoGame = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedGame = await VideoGame.findByIdAndDelete(id);
    if (!deletedGame)
      return res.status(404).json({ error: "Video game not found" });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting video game:", error);
    res.status(500).json({ error: "Failed to delete video game" });
  }
};
