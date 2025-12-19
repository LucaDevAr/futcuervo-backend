import { saveGameAttempt } from "../../services/gameStatsService.js";

export const saveShirtGameAttempt = async (req, res) => {
  try {
    console.log("[v0] saveShirtGameAttempt - Starting");
    console.log("[v0] Request body:", req.body);
    console.log("[v0] User:", req.user);

    const userId = req.user._id || req.user.id;

    if (!userId) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const gameData = {
      ...req.body,
      gameType: "shirt",
    };

    console.log("[v0] Saving shirt game attempt:", {
      userId,
      gameType: gameData.gameType,
      won: gameData.won,
      hintsUsed: gameData.hintsUsed,
      streak: gameData.streak,
    });

    const savedAttempt = await saveGameAttempt(userId, gameData);

    res.json({
      success: true,
      attempt: savedAttempt,
    });
  } catch (error) {
    console.error("[v0] Error saving shirt game attempt:", error);
    res.status(500).json({ error: "Error al guardar el intento" });
  }
};
