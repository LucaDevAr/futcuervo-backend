import CareerGame from "../models/CareerGame.js";
import HistoryGame from "../models/HistoryGame.js";
import PlayerGame from "../models/PlayerGame.js";
import ShirtGame from "../models/ShirtGame.js";
import SongGame from "../models/SongGame.js";
import VideoGame from "../models/VideoGame.js";

// Función para obtener el rango de la fecha actual
const getTodayRange = () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
};

// 🔹 Career Game
// 🔹 Career Game
export const getDailyCareerGame = async () => {
  const { startOfDay, endOfDay } = getTodayRange();

  return await CareerGame.find({
    date: { $gte: startOfDay, $lte: endOfDay },
  })
    .populate({
      path: "player",
      populate: {
        path: "career.club clubsStats.club",
        model: "Club",
        select: "name logo league",
        populate: {
          path: "league",
          select: "name country",
        },
      },
    })
    .populate({
      path: "clubId",
      select: "name logo league",
      populate: {
        path: "league",
        select: "name country",
      },
    })
    .lean();
};

// 🔹 History Game
export const getDailyHistoryGame = async () => {
  const { startOfDay, endOfDay } = getTodayRange();
  return await HistoryGame.find({
    date: { $gte: startOfDay, $lte: endOfDay },
  })
    .populate("clubId")
    .lean(); // Agregar lean() para obtener objetos planos
};

// 🔹 Player Game
export const getDailyPlayerGame = async () => {
  const { startOfDay, endOfDay } = getTodayRange();
  return await PlayerGame.find({
    date: { $gte: startOfDay, $lte: endOfDay },
  })
    .populate("player")
    .populate("clubId")
    .lean(); // Agregar lean() para obtener objetos planos
};

// 🔹 Shirt Game
export const getDailyShirtGame = async () => {
  const { startOfDay, endOfDay } = getTodayRange();
  return await ShirtGame.find({
    date: { $gte: startOfDay, $lte: endOfDay },
  })
    .populate("shirt")
    .populate("clubId")
    .lean(); // Agregar lean() para obtener objetos planos
};

// 🔹 Song Game
export const getDailySongGame = async () => {
  const { startOfDay, endOfDay } = getTodayRange();
  return await SongGame.find({
    date: { $gte: startOfDay, $lte: endOfDay },
  })
    .populate("song")
    .populate("clubId")
    .lean(); // Agregar lean() para obtener objetos planos
};

// 🔹 Video Game
export const getDailyVideoGame = async () => {
  const { startOfDay, endOfDay } = getTodayRange();
  return await VideoGame.find({
    date: { $gte: startOfDay, $lte: endOfDay },
  })
    .populate("video")
    .populate("clubId")
    .lean(); // Agregar lean() para obtener objetos planos
};
