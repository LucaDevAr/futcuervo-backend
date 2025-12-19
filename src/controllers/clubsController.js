import Club from "../models/Club.js";
import { getClubsCache, setClubsCache } from "../services/cacheService.js";

/**
 * Get all clubs (public endpoint with cache)
 */
export const getAllClubs = async (req, res) => {
  try {
    // console.log("[v0] GET /api/clubs - Fetching all clubs");

    // Try to get from cache first
    const cachedClubs = await getClubsCache();
    if (cachedClubs) {
      // console.log(
      //   "[v0] Returning clubs from cache:",
      //   cachedClubs.clubs?.length || 0
      // );
      return res.json({
        clubs: cachedClubs.clubs,
        fromCache: true,
        cachedAt: cachedClubs.cachedAt,
      });
    }

    // If not in cache, fetch from database
    // console.log("[v0] Cache miss, fetching from database");

    const clubs = await Club.find({}).sort({ name: 1 }).lean();

    // console.log("[v0] Fetched clubs from DB:", clubs.length);

    // Cache the result
    await setClubsCache(clubs);

    res.json({
      clubs,
      fromCache: false,
    });
  } catch (error) {
    console.error("[v0] Error fetching clubs:", error);
    res.status(500).json({
      message: "Error al obtener clubes",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};
