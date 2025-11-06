import aggregate from "../models/GameAttempt.js";

export const getUserGameStatus = async (req, res) => {
  const { userId } = req.params;

  try {
    // Traemos el último intento por juego del usuario
    const attempts = await aggregate([
      { $match: { userId } },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: "$gameType",
          latest: { $first: "$$ROOT" },
        },
      },
    ]);

    // Formateamos los datos para el Home
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const result = attempts.map(({ latest }) => {
      const attemptDate = latest.date.toISOString().slice(0, 10);
      const playedToday = attemptDate === today;
      return {
        gameType: latest.gameType,
        streak: latest.streak || 0,
        record: latest.recordScore || latest.score || 0,
        playedToday,
        wonToday: playedToday && latest.won,
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo estado de juegos" });
  }
};
