import { saveGameAttempt } from "../../services/gameStatsService.js";

export const savePlayerGameAttempt = async (req, res) => {
  try {
    // console.log("[v1] savePlayerGameAttempt - Starting");
    // console.log("[v1] Request body:", req.body);
    // console.log("[v1] User:", req.user);

    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const {
      clubId,
      gameMode,
      won,
      streak,
      score,
      recordScore,
      timeUsed,
      livesRemaining,
      gameData, // ✅ SE USA DIRECTO - TAL CUAL
      date,
    } = req.body;

    // ✅ Objeto de intento tal cual requiere el modelo
    const gameAttempt = {
      userId,
      clubId: clubId || null,
      gameType: "player", // Esto sí es fijo porque es juego de jugador
      gameMode: gameMode || "normal",
      date: date || new Date().toISOString(),
      won: !!won,
      streak: streak || 0,
      score: score || 0,
      recordScore: recordScore || 0,
      timeUsed: timeUsed || 0,
      livesRemaining: livesRemaining ?? null,
      gameData: gameData || {}, // ✅ SIN PROCESAR, PASA CRUDO
    };

    // console.log("[v1] Saving player game attempt:", {
    //   userId,
    //   clubId,
    //   won: gameAttempt.won,
    //   streak: gameAttempt.streak,
    //   gameMode: gameAttempt.gameMode,
    // });

    // ✅ Save/update respetando unique index
    const savedAttempt = await saveGameAttempt(userId, gameAttempt);

    return res.json({
      success: true,
      attempt: savedAttempt,
    });
  } catch (error) {
    console.error("[v1] Error saving player game attempt:", error);
    return res.status(500).json({ error: "Error al guardar el intento" });
  }
};
