// src/utils/localStorage.js
// Adaptación para backend Express: almacenamiento en archivo JSON en vez de localStorage del navegador
import fs from "fs";
import path from "path";

const DATA_PATH = path.resolve(process.cwd(), "data/gameData.json");

export const STREAK_GAMES = [
  "player",
  "shirt",
  "song",
  "career",
  "video",
  "history",
  "national",
  "league",
];
export const SCORE_GAMES = ["goals", "appearances"];

function readData() {
  if (!fs.existsSync(DATA_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  } catch {
    return {};
  }
}
function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

export class LocalStorageGameManager {
  static getStorageKey(gameType, date) {
    return `futcuervo_${gameType}_${date}`;
  }
  static getStreakKey(gameType) {
    return `futcuervo_streak_${gameType}`;
  }
  static getRecordKey(gameType) {
    return `futcuervo_record_${gameType}`;
  }

  static hasPlayedToday(gameType) {
    const today = new Date().toISOString().split("T")[0];
    const key = this.getStorageKey(gameType, today);
    const data = readData();
    return !!data[key];
  }

  static getGameResult(gameType, date) {
    const targetDate = date || new Date().toISOString().split("T")[0];
    const key = this.getStorageKey(gameType, targetDate);
    const data = readData();
    return data[key] || null;
  }

  static saveGameResult(gameData) {
    const key = this.getStorageKey(gameData.gameType, gameData.date);
    const data = readData();
    let newStreak = 0;
    if (STREAK_GAMES.includes(gameData.gameType)) {
      if (gameData.won) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        const yesterdayResult = this.getGameResult(
          gameData.gameType,
          yesterdayStr
        );
        newStreak =
          yesterdayResult?.won && yesterdayResult.streak
            ? yesterdayResult.streak + 1
            : 1;
      } else {
        newStreak = 0;
      }
    }
    const dataToSave = {
      ...gameData,
      streak: newStreak,
      timestamp: Date.now(),
    };
    data[key] = dataToSave;
    writeData(data);
    if (STREAK_GAMES.includes(gameData.gameType)) {
      this.updateStreak(gameData.gameType, gameData.won, newStreak);
    } else if (SCORE_GAMES.includes(gameData.gameType)) {
      this.updateRecord(gameData.gameType, gameData.score);
    }
  }

  static updateStreak(gameType, won, newStreak) {
    const data = readData();
    const streakKey = this.getStreakKey(gameType);
    data[streakKey] = newStreak;
    writeData(data);
  }

  static updateRecord(gameType, score) {
    const data = readData();
    const recordKey = this.getRecordKey(gameType);
    const currentRecord = Number.parseInt(data[recordKey] || "0");
    if (score > currentRecord) {
      data[recordKey] = score;
      writeData(data);
    }
  }

  static getCurrentStreak(gameType) {
    if (!STREAK_GAMES.includes(gameType)) return 0;
    const today = new Date();
    let streak = 0;
    for (let i = 1; i <= 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];
      const gameResult = this.getGameResult(gameType, dateStr);
      if (gameResult) {
        if (gameResult.won) {
          streak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    return streak;
  }

  static getCurrentRecord(gameType) {
    if (!SCORE_GAMES.includes(gameType)) return 0;
    const data = readData();
    const recordKey = this.getRecordKey(gameType);
    return Number.parseInt(data[recordKey] || "0");
  }

  static getStreakWithTodayStatus(gameType) {
    const today = new Date().toISOString().split("T")[0];
    const todayResult = this.getGameResult(gameType, today);
    if (todayResult) {
      return {
        streak: todayResult.streak,
        playedToday: true,
        wonToday: todayResult.won,
      };
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const yesterdayResult = this.getGameResult(gameType, yesterdayStr);
    return {
      streak: yesterdayResult?.streak || 0,
      playedToday: false,
      wonToday: false,
    };
  }

  static clearGameData(gameType, date) {
    const targetDate = date || new Date().toISOString().split("T")[0];
    const key = this.getStorageKey(gameType, targetDate);
    const data = readData();
    delete data[key];
    writeData(data);
  }

  static getAllGameData() {
    const data = readData();
    const allData = {};
    Object.keys(data).forEach((key) => {
      if (
        key.startsWith("futcuervo_") &&
        !key.includes("device_id") &&
        !key.includes("streak_") &&
        !key.includes("record_")
      ) {
        allData[key] = data[key];
      }
    });
    return allData;
  }

  static clearOldGameResults(gameType, keepDates) {
    const data = readData();
    const keysToKeep = new Set(
      keepDates.map((date) => this.getStorageKey(gameType, date))
    );
    Object.keys(data).forEach((key) => {
      if (key.startsWith(`futcuervo_${gameType}_`) && !keysToKeep.has(key)) {
        delete data[key];
      }
    });
    writeData(data);
  }
  static getRecordWithTodayStatus(gameType) {
    const today = new Date().toISOString().split("T")[0];
    const todayResult = this.getGameResult(gameType, today);
    return {
      record: this.getCurrentRecord(gameType),
      playedToday: !!todayResult,
      wonToday: !!todayResult?.won,
    };
  }
}
