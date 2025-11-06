import { getCachedAllDailyGames } from "../services/dailyGamesService.js";

/**
 * Get all daily games for all clubs + global (initial cache load)
 * @route GET /api/games/daily/all
 */
export const getAllDailyGames = async (req, res) => {
  try {
    console.log("[v0] Fetching ALL daily games for all clubs and global");

    const games = await getCachedAllDailyGames();

    console.log("[v0] Returning all daily games:", {
      totalClubs: Object.keys(games.gamesByClub || {}).length,
      totalGames: games.totalGames,
    });

    return res.json(games);
  } catch (error) {
    console.error("[v0] Error fetching all daily games:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};
