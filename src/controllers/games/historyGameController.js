import HistoryGame from "../../models/HistoryGame.js";

// Validar preguntas
const validateQuestions = (questions) => {
  if (!questions || questions.length === 0) {
    return "Debe tener al menos una pregunta";
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    if (!q.question || !q.question.trim()) {
      return `La pregunta ${i + 1} está vacía`;
    }
    if (!q.options || q.options.length !== 4) {
      return `La pregunta ${i + 1} debe tener exactamente 4 opciones`;
    }
    if (q.options.some((opt) => !opt || !opt.trim())) {
      return `La pregunta ${i + 1} tiene opciones vacías`;
    }
    if (!q.correctAnswer || !q.correctAnswer.trim()) {
      return `La pregunta ${i + 1} no tiene respuesta correcta`;
    }
    if (!q.options.includes(q.correctAnswer)) {
      return `La respuesta correcta de la pregunta ${
        i + 1
      } no está entre las opciones`;
    }
  }

  return null;
};

// @desc Obtener todos los History Games
// @route GET /api/admin/history-games
export const getHistoryGames = async (req, res) => {
  try {
    const games = await HistoryGame.find().sort({ date: 1 });
    res.json(games);
  } catch (error) {
    console.error("Error al obtener juegos históricos:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// @desc Crear un nuevo History Game
// @route POST /api/admin/history-games
export const createHistoryGame = async (req, res) => {
  try {
    const { date, topic, questions } = req.body;

    // Duplicado por fecha
    const existingByDate = await HistoryGame.findOne({ date: new Date(date) });
    if (existingByDate) {
      return res
        .status(400)
        .json({ error: "Ya existe un juego para esa fecha" });
    }

    // Validar preguntas
    const errorMsg = validateQuestions(questions);
    if (errorMsg) {
      return res.status(400).json({ error: errorMsg });
    }

    const game = await HistoryGame.create({
      date: new Date(date),
      topic,
      questions,
    });

    res.status(201).json(game);
  } catch (error) {
    console.error("Error al crear juego histórico:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// @desc Actualizar un History Game
// @route PUT /api/admin/history-games/:id
export const updateHistoryGame = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, topic, questions } = req.body;

    // Validar preguntas
    const errorMsg = validateQuestions(questions);
    if (errorMsg) {
      return res.status(400).json({ error: errorMsg });
    }

    const game = await HistoryGame.findById(id);
    if (!game) {
      return res.status(404).json({ error: "No existe el juego" });
    }

    game.date = new Date(date);
    game.topic = topic;
    game.questions = questions;
    await game.save();

    res.json(game);
  } catch (error) {
    console.error("Error al actualizar juego histórico:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// @desc Eliminar un History Game
// @route DELETE /api/admin/history-games/:id
export const deleteHistoryGame = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await HistoryGame.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Juego no encontrado" });
    }

    res.json(deleted);
  } catch (error) {
    console.error("Error al eliminar juego histórico:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};
