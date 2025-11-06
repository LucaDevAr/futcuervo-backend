import GameAttempt from "../models/GameAttempt.js";
import { STREAK_GAMES, SCORE_GAMES } from "../utils/localStorage.js";
import { getTodayInArgentina, getPreviousDate } from "../utils/dateUtils.js";

export const getGameProgress = async (req, res) => {
  try {
    const userId = req.user?.email;
    if (!userId) return res.status(401).json({ error: "No autorizado" });
    const { gameType, date } = req.query;
    const today = getTodayInArgentina();
    const queryDate = date || today;
    if (!gameType)
      return res.status(400).json({ error: "gameType es requerido" });
    const todayAttempt = await GameAttempt.findOne({
      userId,
      gameType,
      date: queryDate,
    });
    let currentStreak = 0;
    let currentRecord = 0;
    if (STREAK_GAMES.includes(gameType)) {
      const yesterday = getPreviousDate(today);
      const yesterdayAttempt = await GameAttempt.findOne({
        userId,
        gameType,
        date: yesterday,
      });
      const latestAttempt = await GameAttempt.findOne({
        userId,
        gameType,
      }).sort({ date: -1 });
      if (latestAttempt?.date === yesterday && yesterdayAttempt?.won) {
        currentStreak = yesterdayAttempt.streak || 0;
      } else {
        currentStreak = 0;
      }
      if (todayAttempt?.won) {
        currentStreak = todayAttempt.streak || 1;
      }
    }
    if (SCORE_GAMES.includes(gameType)) {
      const bestAttempt = await GameAttempt.findOne({ userId, gameType }).sort({
        score: -1,
      });
      currentRecord = bestAttempt?.score || 0;
    }
    res.json({
      hasPlayed: !!todayAttempt,
      gameResult: todayAttempt || null,
      currentStreak,
      currentRecord,
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const postGameProgress = async (req, res) => {
  const body = req.body;
  try {
    const userId = req.user?.email;
    if (!userId) return res.status(401).json({ error: "No autorizado" });
    const {
      gameType,
      won,
      attempts,
      score,
      gameData,
      timeUsed,
      livesRemaining,
      gameMode,
    } = body;
    if (!gameType || typeof won !== "boolean")
      return res.status(400).json({ error: "Datos inválidos" });
    const today = getTodayInArgentina();
    let currentStreak = 0;
    let currentRecord = 0;
    if (STREAK_GAMES.includes(gameType)) {
      if (won) {
        const yesterday = getPreviousDate(today);
        const yesterdayAttempt = await GameAttempt.findOne({
          userId,
          gameType,
          date: yesterday,
        });
        currentStreak = yesterdayAttempt?.won
          ? (yesterdayAttempt.streak || 0) + 1
          : 1;
      } else {
        currentStreak = 0;
      }
    }
    if (SCORE_GAMES.includes(gameType)) {
      const bestAttempt = await GameAttempt.findOne({ userId, gameType }).sort({
        score: -1,
      });
      currentRecord = Math.max(bestAttempt?.score || 0, score);
    }
    const newAttempt = new GameAttempt({
      userId,
      gameType,
      date: today,
      won,
      attempts: attempts || 1,
      score: score || 0,
      streak: currentStreak,
      recordScore: SCORE_GAMES.includes(gameType) ? currentRecord : undefined,
      gameData: gameData || {},
      timeUsed,
      livesRemaining,
      gameMode,
    });
    await newAttempt.save();
    res.json({
      success: true,
      gameResult: newAttempt,
      currentStreak,
      currentRecord,
    });
  } catch (error) {
    if (error.code === 11000) {
      const userId = req.user?.email;
      const today = getTodayInArgentina();
      const fallback = await GameAttempt.findOne({
        userId,
        gameType: body.gameType,
        date: today,
      });
      return res.json({
        success: true,
        gameResult: fallback,
        currentStreak: fallback?.streak || 0,
        currentRecord: fallback?.recordScore || 0,
        message: "Ya jugaste este juego hoy",
      });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
