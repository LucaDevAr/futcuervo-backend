import CareerGame from "../models/CareerGame.js";
import HistoryGame from "../models/HistoryGame.js";
import PlayerGame from "../models/PlayerGame.js";
import ShirtGame from "../models/ShirtGame.js";
import SongGame from "../models/SongGame.js";
import VideoGame from "../models/VideoGame.js";
import Player from "../models/Player.js";
import Shirt from "../models/Shirt.js";
import Song from "../models/Song.js";
import Video from "../models/Video.js";
import "../models/Club.js"; // necesario para careerPath.club
import "../models/League.js";

// Helper para calcular inicio y fin de día UTC
const getDayRange = (dateStr) => {
  const date = new Date(dateStr);
  const startOfDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const endOfDay = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );
  return { startOfDay, endOfDay };
};

// ================= Career Game =================
export const getCareerGameByDate = async (req, res) => {
  try {
    const { date: dateStr } = req.query;
    if (!dateStr)
      return res.status(400).json({ error: "Missing date parameter" });

    const { startOfDay, endOfDay } = getDayRange(dateStr);
    const careerGame = await CareerGame.findOne({
      date: { $gte: startOfDay, $lte: endOfDay },
    });
    if (!careerGame) return res.json({ careerGame: null });

    const player = await Player.findById(careerGame.player).populate(
      "careerPath.club"
    );
    if (!player) return res.json({ careerGame: null });

    res.json({
      careerGame: {
        _id: careerGame._id,
        date: careerGame.date,
        player,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching career game" });
  }
};

// ================= History Game =================
export const getHistoryGameByDate = async (req, res) => {
  try {
    const { date: dateStr } = req.query;
    if (!dateStr)
      return res.status(400).json({ error: "Missing date parameter" });

    const { startOfDay, endOfDay } = getDayRange(dateStr);
    const historyGame = await HistoryGame.findOne({
      date: { $gte: startOfDay, $lte: endOfDay },
    });
    if (!historyGame) return res.json({ historyGame: null });

    res.json({ historyGame });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching history game" });
  }
};

// ================= Player Game =================
export const getPlayerGameByDate = async (req, res) => {
  try {
    const { date: dateStr } = req.query;
    if (!dateStr)
      return res.status(400).json({ error: "Missing date parameter" });

    const { startOfDay, endOfDay } = getDayRange(dateStr);
    const playerGame = await PlayerGame.findOne({
      date: { $gte: startOfDay, $lte: endOfDay },
    });
    if (!playerGame) return res.json({ playerGame: null });

    const player = await Player.findById(playerGame.player);
    if (!player) return res.json({ playerGame: null });

    res.json({
      playerGame: {
        _id: playerGame._id,
        date: playerGame.date,
        selectedName: playerGame.selectedName,
        player: player.toObject(),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching player game" });
  }
};

// ================= Shirt Game =================
export const getShirtGameByDate = async (req, res) => {
  try {
    const { date: dateStr } = req.query;
    if (!dateStr)
      return res.status(400).json({ error: "Missing date parameter" });

    const { startOfDay, endOfDay } = getDayRange(dateStr);
    const shirtGame = await ShirtGame.findOne({
      date: { $gte: startOfDay, $lte: endOfDay },
    });
    if (!shirtGame) return res.json({ shirtGame: null });

    const shirt = await Shirt.findById(shirtGame.shirt);
    if (!shirt) return res.json({ shirtGame: null });

    const shirtData = {
      ...shirt.toObject(),
      images: {
        base: shirt.images?.base || "",
        withoutEmblem: shirt.images?.withoutEmblem || "",
        noSponsors: shirt.images?.noSponsors || "",
        withSponsors: shirt.images?.withSponsors || [],
      },
    };

    res.json({
      shirtGame: {
        _id: shirtGame._id,
        date: shirtGame.date,
        shirt: shirtData,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching shirt game" });
  }
};

// ================= Song Game =================
export const getSongGameByDate = async (req, res) => {
  try {
    const { date: dateStr } = req.query;
    if (!dateStr)
      return res.status(400).json({ error: "Missing date parameter" });

    const { startOfDay, endOfDay } = getDayRange(dateStr);
    const songGame = await SongGame.findOne({
      date: { $gte: startOfDay, $lte: endOfDay },
    });
    if (!songGame) return res.json({ songGame: null });

    const song = await Song.findById(songGame.song);

    res.json({
      songGame: {
        _id: songGame._id,
        date: songGame.date,
        song,
        clipStart: songGame.clipStart,
        clipEnd: songGame.clipEnd,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching song game" });
  }
};

// ================= Video Game =================
export const getVideoGameByDate = async (req, res) => {
  try {
    const { date: dateStr } = req.query;
    if (!dateStr)
      return res.status(400).json({ error: "Missing date parameter" });

    const { startOfDay, endOfDay } = getDayRange(dateStr);
    const videoGame = await VideoGame.findOne({
      date: { $gte: startOfDay, $lte: endOfDay },
    });
    if (!videoGame) return res.json({ videoGame: null });

    const video = await Video.findById(videoGame.video);

    res.json({
      videoGame: {
        _id: videoGame._id,
        date: videoGame.date,
        video,
        clipStart: videoGame.clipStart,
        clipEnd: videoGame.clipEnd,
        answerStart: videoGame.answerStart,
        answerEnd: videoGame.answerEnd,
        options: videoGame.options || [],
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching video game" });
  }
};
