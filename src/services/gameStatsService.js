import GameAttempt from "../models/GameAttempt.js";
import { invalidateUserStatsCache } from "./cacheService.js";
import { updatePoints } from "./pointsService.js";

const normalizeAttempt = (attempt) => {
  if (!attempt) return null;
  return {
    _id: attempt._id ? attempt._id.toString() : undefined,
    gameType: attempt.gameType,
    won: attempt.won ?? false,
    score: attempt.score ?? 0,
    streak: attempt.streak ?? 0,
    recordScore: attempt.recordScore ?? attempt.score ?? 0,
    timeUsed: attempt.timeUsed ?? 0,
    livesRemaining: attempt.livesRemaining ?? 0,
    date: attempt.date || attempt.createdAt,
    gameData: attempt.gameData ?? {},
    gameMode: attempt.gameMode ?? "daily",
    clubId: attempt.clubId ? attempt.clubId.toString() : null,
    createdAt: attempt.createdAt,
    updatedAt: attempt.updatedAt,
  };
};

export const getLastAttemptsByUser = async (userId, clubId = null) => {
  const filter = { userId: userId.toString() };
  if (clubId) {
    filter.clubId = clubId.toString();
  } else {
    filter.clubId = null;
  }

  const attempts = await GameAttempt.find(filter)
    .sort({ createdAt: -1 })
    .lean();

  const lastAttempts = {};
  for (const attempt of attempts) {
    if (!lastAttempts[attempt.gameType]) {
      lastAttempts[attempt.gameType] = normalizeAttempt(attempt);
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
    const attempts = await GameAttempt.find({
      userId: userId.toString(),
    })
      .sort({ createdAt: -1 })
      .lean();

    const attemptsByClub = {};

    for (const attempt of attempts) {
      // Fix clave del club
      const clubKey = attempt.clubId ? attempt.clubId.toString() : "__GLOBAL__"; // antes "null"

      if (!attemptsByClub[clubKey]) {
        attemptsByClub[clubKey] = {
          lastAttempts: {},
          totalGames: 0,
          lastUpdated: new Date().toISOString(),
        };
      }

      if (!attemptsByClub[clubKey].lastAttempts[attempt.gameType]) {
        attemptsByClub[clubKey].lastAttempts[attempt.gameType] =
          normalizeAttempt(attempt);
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

function calculateStreakForGameType(
  won,
  todayDateOnly,
  previousAttemptsByDate
) {
  if (!won) return 0;

  // If won, check if yesterday also has a won attempt
  const yesterday = new Date(todayDateOnly);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDateOnly = yesterday.toISOString().split("T")[0];

  const yesterdayAttempt = previousAttemptsByDate[yesterdayDateOnly];

  // If yesterday had a won attempt, increment streak. Otherwise reset to 1
  if (yesterdayAttempt?.won) {
    return (yesterdayAttempt.streak || 1) + 1;
  }

  return 1; // First win in the streak
}

export const saveGameAttempt = async (userId, gameData) => {
  try {
    const filter = {
      userId: userId.toString(),
      gameType: gameData.gameType,
      clubId: gameData.clubId ? gameData.clubId.toString() : null,
    };

    const previousAttempts = await GameAttempt.find(filter)
      .sort({ date: -1 })
      .limit(2)
      .lean();

    // Create a map of attempts by date (YYYY-MM-DD)
    const previousAttemptsByDate = {};
    for (const attempt of previousAttempts) {
      const dateOnly = attempt.date
        ? attempt.date.toISOString().split("T")[0]
        : null;
      if (dateOnly && !previousAttemptsByDate[dateOnly]) {
        previousAttemptsByDate[dateOnly] = attempt;
      }
    }

    const todayDateOnly = gameData.date
      ? new Date(gameData.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    const calculatedStreak = calculateStreakForGameType(
      gameData.won || false,
      todayDateOnly,
      previousAttemptsByDate
    );

    const update = {
      $set: {
        date: gameData.date || new Date(),
        won: gameData.won || false,
        score: gameData.score || 0,
        streak: calculatedStreak, // Use backend-calculated streak instead of trusting frontend
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

    console.log(
      "[v0] Game attempt upserted:",
      attempt._id,
      "with streak:",
      calculatedStreak
    );

    // Actualizar puntos según el flujo
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
