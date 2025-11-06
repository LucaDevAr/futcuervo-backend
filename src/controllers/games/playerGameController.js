import PlayerGame from "../../models/PlayerGame.js";

// @desc Obtener todos los Player Games
// @route GET /api/admin/player-games
export const getPlayerGames = async (req, res) => {
  try {
    const games = await PlayerGame.find().populate("player").sort({ date: 1 });

    res.json(games);
  } catch (error) {
    console.error("Error al obtener player games:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// @desc Crear un nuevo Player Game
// @route POST /api/admin/player-games
export const createPlayerGame = async (req, res) => {
  try {
    const { date, player, selectedName } = req.body;

    // Validaciones
    const existingByDate = await PlayerGame.findOne({ date: new Date(date) });
    if (existingByDate) {
      return res
        .status(400)
        .json({ error: "Ya existe un juego para esa fecha" });
    }

    const existingByPlayer = await PlayerGame.findOne({ player });
    if (existingByPlayer) {
      return res
        .status(400)
        .json({ error: "Ese jugador ya está asignado a otro día" });
    }

    if (!selectedName) {
      return res
        .status(400)
        .json({ error: "Debe seleccionar un nombre para el juego" });
    }

    const game = await PlayerGame.create({
      date: new Date(date),
      player,
      selectedName,
    });

    const populated = await game.populate("player");
    res.status(201).json(populated);
  } catch (error) {
    console.error("Error al crear player game:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// @desc Actualizar un Player Game
// @route PUT /api/admin/player-games/:id
export const updatePlayerGame = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, player, selectedName } = req.body;

    const game = await PlayerGame.findById(id);
    if (!game) {
      return res.status(404).json({ error: "No existe el juego" });
    }

    // Validaciones
    const duplicatePlayer = await PlayerGame.findOne({
      player,
      _id: { $ne: id },
    });
    if (duplicatePlayer) {
      return res.status(400).json({ error: "Ese jugador ya está en otro día" });
    }

    if (!selectedName) {
      return res
        .status(400)
        .json({ error: "Debe seleccionar un nombre para el juego" });
    }

    game.date = new Date(date);
    game.player = player;
    game.selectedName = selectedName;
    await game.save();

    const updated = await game.populate("player");
    res.json(updated);
  } catch (error) {
    console.error("Error al actualizar player game:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// @desc Eliminar un Player Game
// @route DELETE /api/admin/player-games/:id
export const deletePlayerGame = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PlayerGame.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Juego no encontrado" });
    }

    res.json(deleted);
  } catch (error) {
    console.error("Error al eliminar player game:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};
