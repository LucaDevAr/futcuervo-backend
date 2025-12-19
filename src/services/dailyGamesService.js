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
 * Obtiene todos los daily games y los agrupa por clubId
 */
export const getCachedAllDailyGames = async () => {
  try {
    // console.log("[v1] getCachedAllDailyGames - START");

    // 1️⃣ Verificar si está en cache
    const cached = await getAllDailyGamesCache();
    if (cached) {
      // console.log("[v1] Returning daily games from CACHE");
      return cached;
    }

    // console.log("[v1] Cache empty → fetching from DB");

    // 2️⃣ Obtener todos los juegos del día en paralelo
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

    // console.log("[v1] Games fetched from DB");

    // 🔧 Agregar tipo y normalizar clubId
    const normalize = (games, type) =>
      games.map((game) => ({
        ...game,
        gameType: type,
        clubId: game.clubId?._id?.toString() || game.clubId?.toString() || null,
      }));

    // 3️⃣ Unir todos los juegos
    const allGames = [
      ...normalize(careerGames, "career"),
      ...normalize(historyGames, "history"),
      ...normalize(playerGames, "player"),
      ...normalize(shirtGames, "shirt"),
      ...normalize(songGames, "song"),
      ...normalize(videoGames, "video"),
    ];

    // console.log("[v1] Total games:", allGames.length);

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

    // console.log("[v1] Clubs grouped:", Object.keys(clubs).length);

    // 5️⃣ Cachear 24hs
    await cacheAllDailyGames(clubs);

    // console.log("[v1] Daily games cached successfully");

    return clubs;
  } catch (error) {
    console.error("[v1] ❌ Error in getCachedAllDailyGames:", error);
    throw error;
  }
};
