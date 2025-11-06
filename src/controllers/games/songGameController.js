import SongGame from "../../models/SongGame.js";
import Song from "../../models/Song.js";

// @desc Obtener todos los Song Games
// @route GET /api/admin/song-games
export const getSongGames = async (req, res) => {
  try {
    const songGames = await SongGame.find().sort({ date: 1 });

    const populatedGames = await Promise.all(
      songGames.map(async (game) => {
        const song = await Song.findById(game.song);
        return {
          _id: game._id,
          date: game.date,
          song,
          clipStart: game.clipStart,
          clipEnd: game.clipEnd,
        };
      })
    );

    res.json(populatedGames);
  } catch (error) {
    console.error("Error fetching song games:", error);
    res.status(500).json({ error: "Error fetching song games" });
  }
};

// @desc Crear un Song Game
// @route POST /api/admin/song-games
export const createSongGame = async (req, res) => {
  try {
    const { date, song, clipStart, clipEnd } = req.body;

    if (!date || !song) {
      return res.status(400).json({ error: "Date and song are required" });
    }

    // Validar duplicados por fecha
    const existingGame = await SongGame.findOne({
      date: {
        $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
        $lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
      },
    });
    if (existingGame)
      return res
        .status(400)
        .json({ error: "Ya existe un juego para esta fecha" });

    // Validar canción duplicada
    const songAlreadyUsed = await SongGame.findOne({ song });
    if (songAlreadyUsed)
      return res
        .status(400)
        .json({ error: "Esta canción ya está asignada a otro día" });

    let start = clipStart ?? 0;
    let end = clipEnd ?? start + 10;
    if (end - start !== 10) end = start + 10;

    const songGame = await SongGame.create({
      date,
      song,
      clipStart: start,
      clipEnd: end,
    });

    res.status(201).json({ success: true, songGame });
  } catch (error) {
    console.error("Error creating song game:", error);
    res.status(500).json({ error: "Failed to create song game" });
  }
};

// @desc Obtener un Song Game por ID
// @route GET /api/admin/song-games/:id
export const getSongGameById = async (req, res) => {
  try {
    const { id } = req.params;
    const game = await SongGame.findById(id);
    if (!game) return res.status(404).json({ error: "Song game not found" });

    const song = await Song.findById(game.song);

    res.json({
      _id: game._id,
      date: game.date,
      song,
      clipStart: game.clipStart,
      clipEnd: game.clipEnd,
    });
  } catch (error) {
    console.error("Error fetching song game:", error);
    res.status(500).json({ error: "Error fetching song game" });
  }
};

// @desc Actualizar un Song Game
// @route PUT /api/admin/song-games/:id
export const updateSongGame = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, song, clipStart, clipEnd } = req.body;

    if (!date || !song)
      return res.status(400).json({ error: "Date and song are required" });

    const songAlreadyUsed = await SongGame.findOne({ song, _id: { $ne: id } });
    if (songAlreadyUsed)
      return res
        .status(400)
        .json({ error: "Esta canción ya está asignada a otro día" });

    let start = clipStart ?? 0;
    let end = clipEnd ?? start + 10;
    if (end - start !== 10) end = start + 10;

    const updatedGame = await SongGame.findByIdAndUpdate(
      id,
      { date, song, clipStart: start, clipEnd: end },
      { new: true }
    );

    if (!updatedGame)
      return res.status(404).json({ error: "Song game not found" });

    res.json({ success: true, songGame: updatedGame });
  } catch (error) {
    console.error("Error updating song game:", error);
    res.status(500).json({ error: "Failed to update song game" });
  }
};

// @desc Actualizar solo clip de un Song Game
// @route PATCH /api/admin/song-games/:id
export const updateSongGameClip = async (req, res) => {
  try {
    const { id } = req.params;
    const { clipStart, clipEnd } = req.body;

    if (clipStart === undefined || clipEnd === undefined) {
      return res
        .status(400)
        .json({ error: "Se requieren los valores de inicio y fin del clip" });
    }

    let start = clipStart;
    let end = clipEnd;
    if (end - start !== 10) end = start + 10;

    const updatedGame = await SongGame.findByIdAndUpdate(
      id,
      { clipStart: start, clipEnd: end },
      { new: true }
    );

    if (!updatedGame)
      return res.status(404).json({ error: "Song game not found" });

    res.json({ success: true, songGame: updatedGame });
  } catch (error) {
    console.error("Error updating clip values:", error);
    res.status(500).json({ error: "Failed to update clip values" });
  }
};

// @desc Eliminar un Song Game
// @route DELETE /api/admin/song-games/:id
export const deleteSongGame = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedGame = await SongGame.findByIdAndDelete(id);

    if (!deletedGame)
      return res.status(404).json({ error: "Song game not found" });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting song game:", error);
    res.status(500).json({ error: "Failed to delete song game" });
  }
};
