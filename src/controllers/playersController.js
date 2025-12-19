import Player from "../models/Player.js";
import mongoose from "mongoose";
import { getPlayersCache, setPlayersCache } from "../services/cacheService.js";

// Get all players with populated data
export const getAllPlayers = async (req, res) => {
  try {
    // console.log("[v0] GET /api/players - Fetching all players");

    // Try to get from cache first
    const cachedPlayers = await getPlayersCache("all");
    if (cachedPlayers) {
      // console.log("[v0] Returning players from cache:", cachedPlayers.length);
      return res.json({
        players: cachedPlayers,
        fromCache: true,
      });
    }

    // If not in cache, fetch from database
    // console.log("[v0] Cache miss, fetching players from database");

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
      .sort({ createdAt: -1 })
      .lean();

    // console.log("[v0] Fetched players from DB:", players.length);

    // Cache the result until midnight
    await setPlayersCache("all", players);

    res.json({
      players,
      fromCache: false,
    });
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

    // console.log(`[v0] Fetching players with club ${clubId} in their career`);

    // Try to get from cache first
    const cachedPlayers = await getPlayersCache(`club_${clubId}`);
    if (cachedPlayers) {
      // console.log(
      //   `[v0] Returning players from cache for club ${clubId}:`,
      //   cachedPlayers.length
      // );
      return res.json({
        players: cachedPlayers,
        fromCache: true,
      });
    }

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
      .sort({ createdAt: -1 })
      .lean();

    // console.log(`[v0] Found ${players.length} players for club ${clubId}`);

    // Cache the result until midnight
    await setPlayersCache(`club_${clubId}`, players);

    res.json({
      players,
      fromCache: false,
    });
  } catch (error) {
    console.error("Error fetching players by club ID:", error);
    res.status(500).json({ message: "Error al obtener jugadores por club" });
  }
};
