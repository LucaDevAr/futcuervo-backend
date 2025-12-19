import {
  getLastAttemptsByUser,
  saveGameAttempt,
  getAllAttemptsByUser, // Import new service function
} from "../services/gameStatsService.js";
import { getCachedStats } from "../services/cacheService.js";
import { isValidGameType, getClubKeyFromId } from "../config/clubGames.js";

export const getUserLastAttempts = async (req, res) => {
  try {
    // console.log("[v0] getUserLastAttempts - req.user:", req.user);

    const userId = req.user?._id || req.user?.id;
    const clubId = req.query.clubId || null;

    if (!userId) {
      // console.log("[v0] No user ID found in request");
      return res.status(401).json({ error: "Not authenticated" });
    }

    // console.log("[v0] Fetching stats for userId:", userId, "clubId:", clubId);

    const cacheIdentifier = clubId
      ? `${userId.toString()}:${clubId}`
      : userId.toString();

    // Intentar obtener del cache primero
    const result = await getCachedStats(
      "user_stats",
      cacheIdentifier,
      async () => {
        // Función fallback si no está en cache
        // console.log(
        //   "[v0] Cache miss, fetching from database for clubId:",
        //   clubId
        // );
        return await getLastAttemptsByUser(userId.toString(), clubId);
      }
    );

    // console.log("[v0] Returning cached/fresh data:", {
    //   totalAttempts: Object.keys(result.lastAttempts).filter(
    //     (key) => result.lastAttempts[key] !== null
    //   ).length,
    //   totalGames: result.totalGames,
    //   fromCache: result.fromCache || false,
    // });

    return res.json(result);
  } catch (error) {
    console.error("[v0] Error fetching last attempts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createGameAttempt = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const gameData = req.body;

    const clubKey = await getClubKeyFromId(gameData.clubId);
    if (!isValidGameType(clubKey, gameData.gameType)) {
      // console.log(
      //   `[v0] Invalid gameType "${gameData.gameType}" for club "${clubKey}"`
      // );
      return res.status(400).json({
        error: `Game type "${gameData.gameType}" is not available for this club`,
      });
    }

    const attempt = await saveGameAttempt(userId, gameData);
    return res.status(201).json(attempt);
  } catch (error) {
    console.error("[v0] Error creating game attempt:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllUserAttempts = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // console.log("[/attempts/all] Fetching ALL attempts for user:", userId);

    // 👉 usar exactamente la misma llamada que /auth/me
    const result = await getAllAttemptsByUser(userId);

    // console.log(
    //   "[/attempts/all] loaded clubs:",
    //   Object.keys(result.attemptsByClub).length
    // );

    // 👉 devolver EXACTAMENTE lo mismo que /auth/me
    return res.json({
      attemptsByClub: result.attemptsByClub || {},
      totalAttempts: result.totalAttempts,
      lastUpdated: result.lastUpdated,
    });
  } catch (error) {
    console.error("Error in /attempts/all:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
