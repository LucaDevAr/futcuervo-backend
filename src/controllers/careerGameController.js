import CareerGame from "../models/CareerGame.js";

// @desc Obtener todos los Career Games
// @route GET /api/admin/career-games
// @desc Obtener todos los Career Games
// @route GET /api/admin/career-games
export const getCareerGames = async (req, res) => {
  try {
    const { clubId, generalOnly } = req.query;

    let query = {};

    if (clubId) {
      // Si hay un club seleccionado, traer solo los juegos de ese club
      query.clubId = clubId;
    } else if (generalOnly === "true") {
      // Si no hay club, traer los juegos generales (sin clubId)
      query.clubId = null;
    }

    const games = await CareerGame.find(query)
      .populate("player")
      .sort({ date: 1 });

    res.json(games);
  } catch (error) {
    console.error("Error al obtener juegos:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// @desc Crear un nuevo Career Game
// @route POST /api/admin/career-games
export const createCareerGame = async (req, res) => {
  try {
    const { date, player } = req.body;

    // Validar duplicado por fecha
    const existingByDate = await CareerGame.findOne({ date: new Date(date) });
    if (existingByDate) {
      return res
        .status(400)
        .json({ error: "Ya existe un juego para esa fecha" });
    }

    // Validar duplicado por jugador
    const existingByPlayer = await CareerGame.findOne({ player });
    if (existingByPlayer) {
      return res
        .status(400)
        .json({ error: "Ese jugador ya está asignado a otro día" });
    }

    const game = await CareerGame.create({ date: new Date(date), player });
    const populated = await game.populate("player");

    res.status(201).json(populated);
  } catch (error) {
    console.error("Error al crear juego:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// @desc Actualizar un Career Game
// @route PUT /api/admin/career-games/:id
export const updateCareerGame = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, player } = req.body;

    const game = await CareerGame.findById(id);
    if (!game) {
      return res.status(404).json({ error: "No existe el juego" });
    }

    // Evitar duplicado de jugador (excepto el mismo registro)
    const duplicatePlayer = await CareerGame.findOne({
      player,
      _id: { $ne: id },
    });
    if (duplicatePlayer) {
      return res.status(400).json({ error: "Ese jugador ya está en otro día" });
    }

    game.date = new Date(date);
    game.player = player;
    await game.save();

    const updated = await game.populate("player");
    res.json(updated);
  } catch (error) {
    console.error("Error al actualizar juego:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// @desc Eliminar un Career Game
// @route DELETE /api/admin/career-games/:id
export const deleteCareerGame = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await CareerGame.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Juego no encontrado" });
    }

    res.json(deleted);
  } catch (error) {
    console.error("Error al eliminar juego:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};
