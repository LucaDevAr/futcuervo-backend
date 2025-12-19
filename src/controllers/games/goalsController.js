import { saveGameAttempt } from "../../services/gameStatsService.js";

export const saveGoalsGameAttempt = async (req, res) => {
  try {
    // console.log("[v0] saveGoalsGameAttempt - Starting");
    // console.log("[v0] Request body:", req.body);
    // console.log("[v0] User:", req.user);

    const userId = req.user._id || req.user.id;
    const gameData = {
      ...req.body,
      gameType: "goals",
    };

    if (!userId) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    // console.log("[v0] Saving goals game attempt:", {
    //   userId,
    //   gameType: gameData.gameType,
    //   won: gameData.won,
    //   score: gameData.score,
    //   recordScore: gameData.recordScore,
    //   streak: gameData.streak,
    // });

    const savedAttempt = await saveGameAttempt(userId, gameData);

    res.json({
      success: true,
      attempt: savedAttempt,
    });
  } catch (error) {
    console.error("[v0] Error saving goals game attempt:", error);
    res.status(500).json({ error: "Error al guardar el intento" });
  }
};
