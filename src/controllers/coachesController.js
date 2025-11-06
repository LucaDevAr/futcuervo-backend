import Coach from "../models/Coach.js";
import mongoose from "mongoose";
import { getCoachesCache, setCoachesCache } from "../services/cacheService.js";

/**
 * Get all coaches with cache support
 */
export const getAllCoaches = async (req, res) => {
  try {
    console.log("[v0] GET /api/coaches - Fetching all coaches");

    // Try to get from cache first
    const cachedCoaches = await getCoachesCache("all");
    if (cachedCoaches) {
      console.log("[v0] Returning coaches from cache:", cachedCoaches.length);
      return res.json({
        coaches: cachedCoaches,
        fromCache: true,
      });
    }

    // If not in cache, fetch from database
    console.log("[v0] Cache miss, fetching coaches from database");

    const coaches = await Coach.find({})
      .populate({
        path: "careerPath.club",
        select: "name logo league",
        populate: {
          path: "league",
          select: "name country",
        },
      })
      .sort({ fullName: 1 })
      .lean();

    console.log("[v0] Fetched coaches from DB:", coaches.length);

    // Cache the result
    await setCoachesCache("all", coaches);

    res.json({
      coaches,
      fromCache: false,
    });
  } catch (error) {
    console.error("[v0] Error fetching coaches:", error);
    res.status(500).json({
      message: "Error al obtener entrenadores",
      error: error.message,
    });
  }
};

/**
 * Get single coach by ID
 */
export const getCoachById = async (req, res) => {
  try {
    const { id } = req.params;

    const coach = await Coach.findById(id)
      .populate({
        path: "careerPath.club",
        select: "name logo league",
        populate: {
          path: "league",
          select: "name country",
        },
      })
      .lean();

    if (!coach) {
      return res.status(404).json({ message: "Entrenador no encontrado" });
    }

    res.json(coach);
  } catch (error) {
    console.error("[v0] Error fetching coach:", error);
    res.status(500).json({ message: "Error al obtener entrenador" });
  }
};

/**
 * Get coaches by club ID (filters by careerPath.club array)
 */
export const getCoachesByClubId = async (req, res) => {
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
      `[v0] Fetching coaches with club ${clubId} in their careerPath`
    );

    // Try to get from cache first
    const cachedCoaches = await getCoachesCache(`club_${clubId}`);
    if (cachedCoaches) {
      console.log(
        `[v0] Returning coaches from cache for club ${clubId}:`,
        cachedCoaches.length
      );
      return res.json({
        coaches: cachedCoaches,
        fromCache: true,
      });
    }

    // Find coaches where careerPath.club array contains the clubId
    const coaches = await Coach.find({
      "careerPath.club": clubId,
    })
      .populate({
        path: "careerPath.club",
        select: "name logo league",
        populate: {
          path: "league",
          select: "name country",
        },
      })
      .sort({ fullName: 1 })
      .lean();

    console.log(`[v0] Found ${coaches.length} coaches for club ${clubId}`);

    // Cache the result
    await setCoachesCache(`club_${clubId}`, coaches);

    res.json({
      coaches,
      fromCache: false,
    });
  } catch (error) {
    console.error("[v0] Error fetching coaches by club ID:", error);
    res.status(500).json({ message: "Error al obtener entrenadores por club" });
  }
};
