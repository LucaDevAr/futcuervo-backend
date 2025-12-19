import CareerGame from "../../models/CareerGame.js";
import HistoryGame from "../../models/HistoryGame.js";
import ShirtGame from "../../models/ShirtGame.js";
import PlayerGame from "../../models/PlayerGame.js";

// ===== PLAYER GAMES =====

// Get all player games
export const getAllPlayerGames = async (req, res) => {
  try {
    const { clubId, generalOnly } = req.query;

    const filter = {};
    if (clubId) {
      filter.clubId = clubId;
    } else if (generalOnly === "true") {
      filter.$or = [{ clubId: { $exists: false } }, { clubId: null }];
    }

    const games = await PlayerGame.find(filter)
      .populate("player")
      .populate("clubId")
      .sort({ date: 1 });

    res.json(games);
  } catch (error) {
    console.error("Error fetching player games:", error);
    res.status(500).json({ error: "Error al obtener juegos de carrera" });
  }
};

// Get single player game by ID
export const getPlayerGameById = async (req, res) => {
  try {
    const { id } = req.params;

    const game = await PlayerGame.findById(id).populate("player");

    if (!game) {
      return res.status(404).json({ message: "Juego no encontrado" });
    }

    res.json(game);
  } catch (error) {
    console.error("Error fetching player game:", error);
    res.status(500).json({ message: "Error al obtener juego" });
  }
};

// Create player game
export const createPlayerGame = async (req, res) => {
  try {
    // console.log("[v0] createPlayerGame - Starting");
    // console.log("[v0] Request body:", req.body);

    const { date, player, clubId, selectedName } = req.body;

    if (!date || !player || !selectedName) {
      return res.status(400).json({
        error: "Faltan datos requeridos (date, player o selectedName)",
      });
    }

    // Evitar duplicados por fecha y clubId
    const existingByDate = await PlayerGame.findOne({
      date: new Date(date),
      clubId: clubId || { $exists: false },
    });

    if (existingByDate) {
      return res.status(400).json({
        error: clubId
          ? "Ya existe un juego para esa fecha en este club"
          : "Ya existe un juego general para esa fecha",
      });
    }

    // Crear el juego
    const game = await PlayerGame.create({
      date: new Date(date),
      player,
      selectedName,
      ...(clubId ? { clubId } : {}),
    });

    // console.log("[v0] Player game created:", game);

    res.status(201).json({
      success: true,
      game,
    });
  } catch (error) {
    console.error("[v0] Error creating PlayerGame:", error);
    res.status(500).json({
      error: "Error al crear el juego de carrera",
      details: error.message,
    });
  }
};

// Update player game
export const updatePlayerGame = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, player } = req.body;

    // Check for duplicates excluding current game
    if (date) {
      const existingByDate = await PlayerGame.findOne({
        date: new Date(date),
        _id: { $ne: id },
      });
      if (existingByDate) {
        return res.status(400).json({
          error: "Ya existe un juego para esa fecha",
        });
      }
    }

    if (player) {
      const existingByPlayer = await PlayerGame.findOne({
        player,
        _id: { $ne: id },
      });
      if (existingByPlayer) {
        return res.status(400).json({
          error: "Ese jugador ya está asignado a otro día",
        });
      }
    }

    const updateData = {};
    if (date) updateData.date = new Date(date);
    if (player) updateData.player = player;

    const game = await PlayerGame.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("player");

    if (!game) {
      return res.status(404).json({ message: "Juego no encontrado" });
    }

    res.json(game);
  } catch (error) {
    console.error("Error updating player game:", error);
    res.status(500).json({ error: "Error al actualizar juego" });
  }
};

// Delete player game
export const deletePlayerGame = async (req, res) => {
  try {
    const { id } = req.params;

    const game = await PlayerGame.findByIdAndDelete(id);

    if (!game) {
      return res.status(404).json({ message: "Juego no encontrado" });
    }

    res.json({ message: "Juego eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting player game:", error);
    res.status(500).json({ message: "Error al eliminar juego" });
  }
};

// ===== CAREER GAMES =====

// Get all career games
export const getAllCareerGames = async (req, res) => {
  try {
    const { clubId, generalOnly } = req.query;

    const filter = {};
    if (clubId) {
      filter.clubId = clubId;
    } else if (generalOnly === "true") {
      filter.$or = [{ clubId: { $exists: false } }, { clubId: null }];
    }

    const games = await CareerGame.find(filter)
      .populate("player")
      .populate("clubId")
      .sort({ date: 1 });

    res.json(games);
  } catch (error) {
    console.error("Error fetching career games:", error);
    res.status(500).json({ error: "Error al obtener juegos de carrera" });
  }
};

// Get single career game by ID
export const getCareerGameById = async (req, res) => {
  try {
    const { id } = req.params;

    const game = await CareerGame.findById(id).populate("player");

    if (!game) {
      return res.status(404).json({ message: "Juego no encontrado" });
    }

    res.json(game);
  } catch (error) {
    console.error("Error fetching career game:", error);
    res.status(500).json({ message: "Error al obtener juego" });
  }
};

// Create career game
export const createCareerGame = async (req, res) => {
  try {
    // console.log("[v0] createCareerGame - Starting");
    // console.log("[v0] Request body:", req.body);

    const { date, player, clubId } = req.body;

    if (!date || !player) {
      return res.status(400).json({
        error: "Faltan datos requeridos (date o player)",
      });
    }

    // Evitar duplicados por fecha y clubId
    const existingByDate = await CareerGame.findOne({
      date: new Date(date),
      clubId: clubId || { $exists: false },
    });

    if (existingByDate) {
      return res.status(400).json({
        error: clubId
          ? "Ya existe un juego para esa fecha en este club"
          : "Ya existe un juego general para esa fecha",
      });
    }

    // Crear el juego
    const game = await CareerGame.create({
      date: new Date(date),
      player,
      ...(clubId ? { clubId } : {}),
    });

    // console.log("[v0] Career game created:", game);

    res.status(201).json({
      success: true,
      game,
    });
  } catch (error) {
    console.error("[v0] Error creating CareerGame:", error);
    res.status(500).json({
      error: "Error al crear el juego de carrera",
      details: error.message,
    });
  }
};

// Update career game
export const updateCareerGame = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, player } = req.body;

    // Check for duplicates excluding current game
    if (date) {
      const existingByDate = await CareerGame.findOne({
        date: new Date(date),
        _id: { $ne: id },
      });
      if (existingByDate) {
        return res.status(400).json({
          error: "Ya existe un juego para esa fecha",
        });
      }
    }

    if (player) {
      const existingByPlayer = await CareerGame.findOne({
        player,
        _id: { $ne: id },
      });
      if (existingByPlayer) {
        return res.status(400).json({
          error: "Ese jugador ya está asignado a otro día",
        });
      }
    }

    const updateData = {};
    if (date) updateData.date = new Date(date);
    if (player) updateData.player = player;

    const game = await CareerGame.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("player");

    if (!game) {
      return res.status(404).json({ message: "Juego no encontrado" });
    }

    res.json(game);
  } catch (error) {
    console.error("Error updating career game:", error);
    res.status(500).json({ error: "Error al actualizar juego" });
  }
};

// Delete career game
export const deleteCareerGame = async (req, res) => {
  try {
    const { id } = req.params;

    const game = await CareerGame.findByIdAndDelete(id);

    if (!game) {
      return res.status(404).json({ message: "Juego no encontrado" });
    }

    res.json({ message: "Juego eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting career game:", error);
    res.status(500).json({ message: "Error al eliminar juego" });
  }
};

// ===== HISTORY GAMES =====

// Get all history games
export const getAllHistoryGames = async (req, res) => {
  try {
    const games = await HistoryGame.find().sort({ date: 1 });
    res.json(games);
  } catch (error) {
    console.error("Error fetching history games:", error);
    res.status(500).json({ error: "Error al obtener juegos de historia" });
  }
};

// Get single history game by ID
export const getHistoryGameById = async (req, res) => {
  try {
    const { id } = req.params;

    const game = await HistoryGame.findById(id);

    if (!game) {
      return res.status(404).json({ message: "Juego no encontrado" });
    }

    res.json(game);
  } catch (error) {
    console.error("Error fetching history game:", error);
    res.status(500).json({ message: "Error al obtener juego" });
  }
};

// Create history game
export const createHistoryGame = async (req, res) => {
  try {
    const { date, topic, questions } = req.body;

    // Avoid duplicates by date
    const existingByDate = await HistoryGame.findOne({ date: new Date(date) });
    if (existingByDate) {
      return res.status(400).json({
        error: "Ya existe un juego para esa fecha",
      });
    }

    // Validate at least one question
    if (!questions || questions.length === 0) {
      return res.status(400).json({
        error: "Debe tener al menos una pregunta",
      });
    }

    // Validate each question has 4 options and a correct answer
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];

      if (!question.question || !question.question.trim()) {
        return res.status(400).json({
          error: `La pregunta ${i + 1} está vacía`,
        });
      }

      if (!question.options || question.options.length !== 4) {
        return res.status(400).json({
          error: `La pregunta ${i + 1} debe tener exactamente 4 opciones`,
        });
      }

      if (question.options.some((opt) => !opt || !opt.trim())) {
        return res.status(400).json({
          error: `La pregunta ${i + 1} tiene opciones vacías`,
        });
      }

      if (!question.correctAnswer || !question.correctAnswer.trim()) {
        return res.status(400).json({
          error: `La pregunta ${i + 1} no tiene respuesta correcta`,
        });
      }

      if (!question.options.includes(question.correctAnswer)) {
        return res.status(400).json({
          error: `La respuesta correcta de la pregunta ${
            i + 1
          } no está entre las opciones`,
        });
      }
    }

    const game = await HistoryGame.create({
      date: new Date(date),
      topic,
      questions,
    });

    res.status(201).json(game);
  } catch (error) {
    console.error("Error creating history game:", error);
    res.status(500).json({ error: "Error al crear el juego" });
  }
};

// Update history game
export const updateHistoryGame = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, topic, questions } = req.body;

    // Check for duplicates excluding current game
    if (date) {
      const existingByDate = await HistoryGame.findOne({
        date: new Date(date),
        _id: { $ne: id },
      });
      if (existingByDate) {
        return res.status(400).json({
          error: "Ya existe un juego para esa fecha",
        });
      }
    }

    // Validate questions if provided
    if (questions) {
      if (questions.length === 0) {
        return res.status(400).json({
          error: "Debe tener al menos una pregunta",
        });
      }

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];

        if (!question.question || !question.question.trim()) {
          return res.status(400).json({
            error: `La pregunta ${i + 1} está vacía`,
          });
        }

        if (!question.options || question.options.length !== 4) {
          return res.status(400).json({
            error: `La pregunta ${i + 1} debe tener exactamente 4 opciones`,
          });
        }

        if (question.options.some((opt) => !opt || !opt.trim())) {
          return res.status(400).json({
            error: `La pregunta ${i + 1} tiene opciones vacías`,
          });
        }

        if (!question.correctAnswer || !question.correctAnswer.trim()) {
          return res.status(400).json({
            error: `La pregunta ${i + 1} no tiene respuesta correcta`,
          });
        }

        if (!question.options.includes(question.correctAnswer)) {
          return res.status(400).json({
            error: `La respuesta correcta de la pregunta ${
              i + 1
            } no está entre las opciones`,
          });
        }
      }
    }

    const updateData = {};
    if (date) updateData.date = new Date(date);
    if (topic) updateData.topic = topic;
    if (questions) updateData.questions = questions;

    const game = await HistoryGame.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!game) {
      return res.status(404).json({ message: "Juego no encontrado" });
    }

    res.json(game);
  } catch (error) {
    console.error("Error updating history game:", error);
    res.status(500).json({ error: "Error al actualizar el juego" });
  }
};

// Delete history game
export const deleteHistoryGame = async (req, res) => {
  try {
    const { id } = req.params;

    const game = await HistoryGame.findByIdAndDelete(id);

    if (!game) {
      return res.status(404).json({ message: "Juego no encontrado" });
    }

    res.json({ message: "Juego eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting history game:", error);
    res.status(500).json({ message: "Error al eliminar juego" });
  }
};

// ===== SHIRT GAMES =====

// Get all shirt games
export const getAllShirtGames = async (req, res) => {
  try {
    const games = await ShirtGame.find()
      .populate("shirt")
      .populate("clubId")
      .sort({ date: 1 });
    res.json(games);
  } catch (error) {
    console.error("Error fetching shirt games:", error);
    res.status(500).json({ error: "Error al obtener juegos de camiseta" });
  }
};

// Get single shirt game by ID
export const getShirtGameById = async (req, res) => {
  try {
    const { id } = req.params;

    const game = await ShirtGame.findById(id)
      .populate("shirt")
      .populate("clubId");

    if (!game) {
      return res.status(404).json({ message: "Juego no encontrado" });
    }

    res.json(game);
  } catch (error) {
    console.error("Error fetching shirt game:", error);
    res.status(500).json({ message: "Error al obtener juego" });
  }
};

// Create shirt game
export const createShirtGame = async (req, res) => {
  try {
    const { date, shirt, clubId } = req.body;

    const existingByDateAndClub = await ShirtGame.findOne({
      date: new Date(date),
      clubId: clubId || null,
    });

    if (existingByDateAndClub) {
      return res.status(400).json({
        error: clubId
          ? "Ya existe un juego para esa fecha y ese club"
          : "Ya existe un juego general para esa fecha",
      });
    }

    // Check if shirt is already assigned to another date (regardless of club)
    const existingByShirt = await ShirtGame.findOne({ shirt });
    if (existingByShirt) {
      return res.status(400).json({
        error: "Esa camiseta ya está asignada a otro día",
      });
    }

    const gameData = {
      date: new Date(date),
      shirt,
    };

    if (clubId) {
      gameData.clubId = clubId;
    }

    const game = await ShirtGame.create(gameData);
    const populated = await game.populate(["shirt", "clubId"]);

    res.status(201).json(populated);
  } catch (error) {
    console.error("Error creating shirt game:", error);
    res.status(500).json({ error: "Error al crear juego de camiseta" });
  }
};

// Update shirt game
export const updateShirtGame = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, shirt, clubId } = req.body;

    if (date !== undefined) {
      const existingByDateAndClub = await ShirtGame.findOne({
        date: new Date(date),
        clubId: clubId !== undefined ? clubId || null : undefined,
        _id: { $ne: id },
      });

      if (existingByDateAndClub) {
        return res.status(400).json({
          error:
            clubId !== undefined && clubId
              ? "Ya existe un juego para esa fecha y ese club"
              : "Ya existe un juego general para esa fecha",
        });
      }
    }

    if (shirt) {
      const existingByShirt = await ShirtGame.findOne({
        shirt,
        _id: { $ne: id },
      });
      if (existingByShirt) {
        return res.status(400).json({
          error: "Esa camiseta ya está asignada a otro día",
        });
      }
    }

    const updateData = {};
    if (date) updateData.date = new Date(date);
    if (shirt) updateData.shirt = shirt;
    if (clubId !== undefined) {
      updateData.clubId = clubId || null;
    }

    const game = await ShirtGame.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate(["shirt", "clubId"]);

    if (!game) {
      return res.status(404).json({ message: "Juego no encontrado" });
    }

    res.json(game);
  } catch (error) {
    console.error("Error updating shirt game:", error);
    res.status(500).json({ error: "Error al actualizar juego" });
  }
};

// Delete shirt game
export const deleteShirtGame = async (req, res) => {
  try {
    const { id } = req.params;

    const game = await ShirtGame.findByIdAndDelete(id);

    if (!game) {
      return res.status(404).json({ message: "Juego no encontrado" });
    }

    res.json({ message: "Juego eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting shirt game:", error);
    res.status(500).json({ message: "Error al eliminar juego" });
  }
};
