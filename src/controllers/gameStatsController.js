import {
  getLastAttemptsByUser,
  saveGameAttempt,
  getAllAttemptsByUser, // Import new service function
} from "../services/gameStatsService.js"
import { getCachedStats } from "../services/cacheService.js"
import { isValidGameType, getClubKeyFromId } from "../config/clubGames.js"

export const getUserLastAttempts = async (req, res) => {
  try {
    console.log("[v0] getUserLastAttempts - req.user:", req.user)

    const userId = req.user?._id || req.user?.id
    const clubId = req.query.clubId || null

    if (!userId) {
      console.log("[v0] No user ID found in request")
      return res.status(401).json({ error: "Not authenticated" })
    }

    console.log("[v0] Fetching stats for userId:", userId, "clubId:", clubId)

    const cacheIdentifier = clubId ? `${userId.toString()}:${clubId}` : userId.toString()

    // Intentar obtener del cache primero
    const result = await getCachedStats("user_stats", cacheIdentifier, async () => {
      // Función fallback si no está en cache
      console.log("[v0] Cache miss, fetching from database for clubId:", clubId)
      return await getLastAttemptsByUser(userId.toString(), clubId)
    })

    console.log("[v0] Returning cached/fresh data:", {
      totalAttempts: Object.keys(result.lastAttempts).filter((key) => result.lastAttempts[key] !== null).length,
      totalGames: result.totalGames,
      fromCache: result.fromCache || false,
    })

    return res.json(result)
  } catch (error) {
    console.error("[v0] Error fetching last attempts:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const createGameAttempt = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" })
    }

    const gameData = req.body

    const clubKey = await getClubKeyFromId(gameData.clubId)
    if (!isValidGameType(clubKey, gameData.gameType)) {
      console.log(`[v0] Invalid gameType "${gameData.gameType}" for club "${clubKey}"`)
      return res.status(400).json({
        error: `Game type "${gameData.gameType}" is not available for this club`,
      })
    }

    const attempt = await saveGameAttempt(userId, gameData)
    return res.status(201).json(attempt)
  } catch (error) {
    console.error("[v0] Error creating game attempt:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const getAllUserAttempts = async (req, res) => {
  try {
    console.log("[v0] getAllUserAttempts - req.user:", req.user)

    const userId = req.user?._id || req.user?.id

    if (!userId) {
      console.log("[v0] No user ID found in request")
      return res.status(401).json({ error: "Not authenticated" })
    }

    console.log("[v0] Fetching ALL attempts for userId:", userId)

    // Use special cache key for all attempts
    const cacheIdentifier = `${userId.toString()}:all`

    const result = await getCachedStats("user_stats", cacheIdentifier, async () => {
      console.log("[v0] Cache miss, fetching all attempts from database")
      return await getAllAttemptsByUser(userId.toString())
    })

    console.log("[v0] Returning all attempts data:", {
      totalClubs: Object.keys(result.attemptsByClub || {}).length,
      totalAttempts: result.totalAttempts,
      fromCache: result.fromCache || false,
    })

    return res.json(result)
  } catch (error) {
    console.error("[v0] Error fetching all attempts:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}
