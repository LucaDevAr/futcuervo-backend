import Player from "../models/Player.js";
import mongoose from "mongoose";

// Get all players with populated data
export const getAllPlayers = async (req, res) => {
  try {
    const players = await Player.find({})
      .populate({
        path: "career.club",
        select: "name logo league",
        populate: {
          path: "league",
          select: "name country",
        },
      })
      .populate({
        path: "clubsStats.club",
        select: "name logo",
      })
      .sort({ createdAt: -1 });

    res.json(players);
  } catch (error) {
    console.error("Error fetching players:", error);
    res.status(500).json({ message: "Error al obtener jugadores" });
  }
};

// Get single player by ID
export const getPlayerById = async (req, res) => {
  try {
    const { id } = req.params;

    const player = await Player.findById(id)
      .populate({
        path: "career.club",
        select: "name logo league",
        populate: {
          path: "league",
          select: "name country",
        },
      })
      .populate({
        path: "clubsStats.club",
        select: "name logo",
      });

    if (!player) {
      return res.status(404).json({ message: "Jugador no encontrado" });
    }

    res.json(player);
  } catch (error) {
    console.error("Error fetching player:", error);
    res.status(500).json({ message: "Error al obtener jugador" });
  }
};

// Get players by club ID (filters by career.club array)
export const getPlayersByClubId = async (req, res) => {
  try {
    const { clubId } = req.query;

    if (!clubId) {
      return res.status(400).json({ message: "clubId is required" });
    }

    // Validate if clubId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(clubId)) {
      return res.status(400).json({ message: "Invalid clubId format" });
    }

    console.log(
      `[Backend] Fetching players with club ${clubId} in their career`
    );

    // Find players where career.club array contains the clubId
    const players = await Player.find({
      "career.club": clubId,
    })
      .populate({
        path: "career.club",
        select: "name logo league",
        populate: {
          path: "league",
          select: "name country",
        },
      })
      .populate({
        path: "clubsStats.club",
        select: "name logo",
      })
      .sort({ createdAt: -1 });

    console.log(`[Backend] Found ${players.length} players for club ${clubId}`);

    res.json(players);
  } catch (error) {
    console.error("Error fetching players by club ID:", error);
    res.status(500).json({ message: "Error al obtener jugadores por club" });
  }
};
