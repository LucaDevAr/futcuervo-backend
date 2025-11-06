import {
  getDailyCareerGame,
  getDailyHistoryGame,
  getDailyPlayerGame,
  getDailyShirtGame,
  getDailySongGame,
  getDailyVideoGame,
} from "./individualGamesService.js";
import { cacheAllDailyGames, getAllDailyGamesCache } from "./cacheService.js";

/**
 * Obtiene todos los daily games y los agrupa por clubId (como attempts)
 */
export const getCachedAllDailyGames = async () => {
  try {
    console.log("[v0] getCachedAllDailyGames - Starting");

    // 1️⃣ Verificar si está en cache
    const cached = await getAllDailyGamesCache();
    if (cached) {
      console.log("[v0] Returning daily games from cache");
      return cached;
    }

    console.log("[v0] Cache empty, fetching from DB...");

    // 2️⃣ Obtener todos los tipos de juegos
    const [
      careerGames,
      historyGames,
      playerGames,
      shirtGames,
      songGames,
      videoGames,
    ] = await Promise.all([
      getDailyCareerGame(),
      getDailyHistoryGame(),
      getDailyPlayerGame(),
      getDailyShirtGame(),
      getDailySongGame(),
      getDailyVideoGame(),
    ]);

    const addGameType = (games, type) =>
      games.map((game) => {
        const gameObj = game.toObject ? game.toObject() : game;
        return {
          ...gameObj,
          gameType: type,
          // Normalizar clubId: extraer solo el _id como string
          clubId: gameObj.clubId?._id?.toString() || gameObj.clubId || null,
        };
      });

    const allGames = [
      ...addGameType(careerGames, "career"),
      ...addGameType(historyGames, "history"),
      ...addGameType(playerGames, "player"),
      ...addGameType(shirtGames, "shirt"),
      ...addGameType(songGames, "song"),
      ...addGameType(videoGames, "video"),
    ];

    console.log("[v0] Total games fetched:", allGames.length);
    console.log("[v0] Sample game:", allGames[0]);

    // 4️⃣ Agrupar por clubId
    const clubs = {};

    for (const game of allGames) {
      const clubKey = game.clubId || "null";

      if (!clubs[clubKey]) {
        clubs[clubKey] = {
          lastGames: {},
          totalGames: 0,
          lastUpdated: new Date().toISOString(),
        };
      }

      clubs[clubKey].lastGames[game.gameType] = game;
      clubs[clubKey].totalGames++;
    }

    console.log("[v0] Clubs structure:", Object.keys(clubs));
    console.log("[v0] Sample club data:", clubs[Object.keys(clubs)[0]]);

    // 5️⃣ Cachear la versión simple por club
    await cacheAllDailyGames(clubs);
    console.log("[v0] Cached daily games successfully");

    return clubs;
  } catch (error) {
    console.error("[v0] ❌ Error in getCachedAllDailyGames:", error);
    throw error;
  }
};
