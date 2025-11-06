import GameAttempt from "../models/GameAttempt.js";
import { invalidateUserStatsCache } from "./cacheService.js";
import { updatePoints } from "./pointsService.js";

export const getLastAttemptsByUser = async (userId, clubId = null) => {
  const filter = { userId: userId.toString() };
  if (clubId) {
    filter.clubId = clubId.toString();
  } else {
    filter.clubId = null; // home principal
  }

  const attempts = await GameAttempt.find(filter)
    .sort({ createdAt: -1 })
    .lean();

  const lastAttempts = {};
  for (const attempt of attempts) {
    if (!lastAttempts[attempt.gameType]) {
      lastAttempts[attempt.gameType] = {
        ...attempt,
        _id: attempt._id.toString(),
      };
    }
  }

  const totalGames = attempts.length;

  return {
    lastAttempts,
    totalGames,
    lastUpdated: new Date().toISOString(),
  };
};

export const getAllAttemptsByUser = async (userId) => {
  try {
    // Get all attempts for this user, regardless of clubId
    const attempts = await GameAttempt.find({
      userId: userId.toString(),
    })
      .sort({ createdAt: -1 })
      .lean();

    // Group attempts by clubId
    const attemptsByClub = {};

    for (const attempt of attempts) {
      const clubKey = attempt.clubId ? attempt.clubId.toString() : "null";

      if (!attemptsByClub[clubKey]) {
        attemptsByClub[clubKey] = {
          lastAttempts: {},
          totalGames: 0,
        };
      }

      // Only keep the most recent attempt per gameType
      if (!attemptsByClub[clubKey].lastAttempts[attempt.gameType]) {
        attemptsByClub[clubKey].lastAttempts[attempt.gameType] = {
          ...attempt,
          _id: attempt._id.toString(),
        };
      }

      attemptsByClub[clubKey].totalGames++;
    }

    return {
      attemptsByClub,
      totalAttempts: attempts.length,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[v0] Error getting all attempts by user:", error);
    throw error;
  }
};

export const saveGameAttempt = async (userId, gameData) => {
  try {
    const filter = {
      userId: userId.toString(),
      gameType: gameData.gameType,
      clubId: gameData.clubId ? gameData.clubId.toString() : null,
    };

    const update = {
      $set: {
        date: gameData.date || new Date(),
        won: gameData.won || false,
        score: gameData.score || 0,
        streak: gameData.streak || 0,
        recordScore: gameData.recordScore || gameData.score || 0,
        gameData: gameData.gameData || {},
        timeUsed: gameData.timeUsed || 0,
        livesRemaining: gameData.livesRemaining || 0,
        gameMode: gameData.gameMode || "daily",
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    };

    const attempt = await GameAttempt.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
      runValidators: true,
    });

    console.log("[v0] Game attempt upserted:", attempt._id);

    // 🔹 Actualizar puntos según el flujo
    const pointsAdded = await updatePoints({
      userId,
      clubId: gameData.clubId,
      won: gameData.won,
    });

    console.log("[v0] Points added:", pointsAdded);

    // Invalidar cache del usuario después de guardar/actualizar intento
    await invalidateUserStatsCache(userId);

    return attempt;
  } catch (error) {
    console.error("[v0] Error upserting game attempt:", error);
    throw error;
  }
};
