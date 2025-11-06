import { redisClient } from "../utils/redisClient.js";

/**
 * Servicio de cache para estadísticas de juegos
 * Utiliza Redis para almacenar datos temporalmente y mejorar performance
 */

const CACHE_TTL = {
  USER_STATS: 60 * 30, // 30 minutos para stats de usuario
  GLOBAL_STATS: 60 * 60, // 1 hora para stats globales
  LEADERBOARD: 60 * 10, // 10 minutos para leaderboards
  PLAYERS: 60 * 60 * 24, // 24 horas para jugadores
  DAILY_GAMES: 60 * 60 * 24, // 24 horas para juegos del día
  COACHES: 60 * 60 * 24, // 24 horas para entrenadores
};

/**
 * Genera claves de cache consistentes
 */
const getCacheKey = (type, identifier) => {
  return `game_stats:${type}:${identifier}`;
};

/**
 * Obtiene datos del cache
 */
export const getFromCache = async (type, identifier) => {
  try {
    const key = getCacheKey(type, identifier);
    console.log("[v0] Cache GET attempt for key:", key);

    const cached = await redisClient.get(key);
    if (cached) {
      console.log("[v0] Cache HIT for key:", key);
      const parsed = JSON.parse(cached);
      return { ...parsed, fromCache: true };
    }

    console.log("[v0] Cache MISS for key:", key);
    return null;
  } catch (error) {
    console.error("[v0] Cache get error:", error);
    return null;
  }
};

/**
 * Guarda datos en el cache
 */
export const setCache = async (type, identifier, data, customTTL = null) => {
  try {
    const key = getCacheKey(type, identifier);
    const ttl = customTTL || CACHE_TTL[type.toUpperCase()] || 300;

    console.log("[v0] Cache SET for key:", key, "TTL:", ttl);

    // Agregar timestamp para debugging
    const dataWithMeta = {
      ...data,
      cachedAt: new Date().toISOString(),
      fromCache: false,
    };

    await redisClient.set(key, JSON.stringify(dataWithMeta), { EX: ttl });
    console.log("[v0] Cache SET successful for key:", key);
    return true;
  } catch (error) {
    console.error("[v0] Cache set error:", error);
    return false;
  }
};

/**
 * Invalida cache específico
 */
export const invalidateCache = async (type, identifier) => {
  try {
    const key = getCacheKey(type, identifier);
    console.log("[v0] Cache INVALIDATE for key:", key);
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error("[v0] Cache invalidation error:", error);
    return false;
  }
};

/**
 * Invalida cache de usuario cuando actualiza sus stats
 */
export const invalidateUserStatsCache = async (userId, clubId = null) => {
  try {
    await invalidateCache("user_stats", `${userId.toString()}:all`);
    console.log("[v0] All attempts cache invalidated for userId:", userId);

    if (clubId) {
      await invalidateCache("user_stats", `${userId.toString()}:${clubId}`);
      console.log(
        "[v0] User stats cache invalidated for userId:",
        userId,
        "clubId:",
        clubId
      );
    } else {
      // Invalidate all club caches for this user
      await invalidateCachePattern(`user_stats:${userId.toString()}`);
      console.log("[v0] All user stats cache invalidated for userId:", userId);
    }
    return true;
  } catch (error) {
    console.error("[v0] Error invalidating user stats cache:", error);
    return false;
  }
};

/**
 * Obtiene estadísticas del cache con fallback
 */
export const getCachedStats = async (type, identifier, fallbackFn) => {
  // Intentar obtener del cache primero
  let data = await getFromCache(type, identifier);

  if (!data && fallbackFn) {
    // Si no está en cache, ejecutar función fallback
    console.log("[v0] Executing fallback function for:", type, identifier);
    data = await fallbackFn();
    if (data) {
      // Guardar en cache para próximas consultas
      await setCache(type, identifier, data);
      data.fromCache = false;
    }
  }

  return data;
};

/**
 * Invalida múltiples caches por patrón
 */
export const invalidateCachePattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(`game_stats:${pattern}*`);
    if (keys.length > 0) {
      console.log(
        "[v0] Invalidating cache pattern:",
        pattern,
        "Keys:",
        keys.length
      );
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    console.error("[v0] Cache pattern invalidation error:", error);
    return false;
  }
};

/**
 * Limpia todo el cache de estadísticas
 */
export const clearAllStatsCache = async () => {
  try {
    const keys = await redisClient.keys("game_stats:*");
    if (keys.length > 0) {
      console.log("[v0] Clearing all stats cache, keys:", keys.length);
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    console.error("[v0] Clear all cache error:", error);
    return false;
  }
};

const getPlayersCacheKey = (identifier) => {
  return `players:${identifier || "global"}`;
};

/**
 * Guardar jugadores en cache
 */
export const setPlayersCache = async (
  identifier,
  data,
  ttl = CACHE_TTL.PLAYERS
) => {
  try {
    const key = getPlayersCacheKey(identifier);

    const dataToCache = {
      payload: data, // datos reales bajo "payload"
      cachedAt: new Date().toISOString(),
      fromCache: false,
    };

    await redisClient.set(key, JSON.stringify(dataToCache), { EX: ttl });
    console.log("[v1] Players cache SET for key:", key);
    return true;
  } catch (err) {
    console.error("[v1] Error setting players cache:", err);
    return false;
  }
};

/**
 * Obtener jugadores del cache
 */
export const getPlayersCache = async (identifier) => {
  try {
    const key = getPlayersCacheKey(identifier);
    const cached = await redisClient.get(key);

    if (!cached) {
      console.log("[v1] Players cache MISS for key:", key);
      return null;
    }

    const parsed = JSON.parse(cached);
    console.log("[v1] Players cache HIT for key:", key);
    return parsed.payload; // devolver solo los datos reales
  } catch (err) {
    console.error("[v1] Error getting players cache:", err);
    return null;
  }
};

/**
 * Limpiar cache de jugadores
 */
export const clearPlayersCache = async (identifier = null) => {
  try {
    const key = identifier ? getPlayersCacheKey(identifier) : "players*";
    const keys = identifier ? [key] : await redisClient.keys("players*");

    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log("[v1] Players cache cleared, keys:", keys.length);
    } else {
      console.log("[v1] No players cache found to clear");
    }

    return true;
  } catch (err) {
    console.error("[v1] Error clearing players cache:", err);
    return false;
  }
};

/**
 * Cache key for clubs
 */
const getClubsCacheKey = () => {
  return "clubs:all";
};

/**
 * Get clubs from cache
 */
export const getClubsCache = async () => {
  try {
    const key = getClubsCacheKey();
    const cached = await redisClient.get(key);

    if (!cached) {
      console.log("[v0] Clubs cache MISS");
      return null;
    }

    const parsed = JSON.parse(cached);
    console.log("[v0] Clubs cache HIT");
    return parsed;
  } catch (err) {
    console.error("[v0] Error getting clubs cache:", err);
    return null;
  }
};

/**
 * Set clubs in cache with 24 hour TTL
 */
export const setClubsCache = async (clubs) => {
  try {
    const key = getClubsCacheKey();
    const ttl = 60 * 60 * 24; // 24 hours

    const dataToCache = {
      clubs,
      cachedAt: new Date().toISOString(),
    };

    await redisClient.set(key, JSON.stringify(dataToCache), { EX: ttl });
    console.log("[v0] Clubs cache SET with 24h TTL");
    return true;
  } catch (err) {
    console.error("[v0] Error setting clubs cache:", err);
    return false;
  }
};

/**
 * Clear clubs cache
 */
export const clearClubsCache = async () => {
  try {
    const key = getClubsCacheKey();
    await redisClient.del(key);
    console.log("[v0] Clubs cache cleared");
    return true;
  } catch (err) {
    console.error("[v0] Error clearing clubs cache:", err);
    return false;
  }
};

/**
 * Clear daily games cache
 */
export const clearDailyGamesCache = async () => {
  try {
    const patterns = ["game_stats:daily_games:*", "game_stats:DAILY_GAMES:*"];
    let total = 0;

    for (const pattern of patterns) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
        total += keys.length;
      }
    }

    console.log(`[v0] Cleared ${total} daily games cache keys`);
    return true;
  } catch (error) {
    console.error("[v0] Error clearing daily games cache:", error);
    return false;
  }
};

/**
 * Obtiene el cache de todos los juegos diarios
 */
export const getAllDailyGamesCache = async () => {
  try {
    const key = "game_stats:DAILY_GAMES:all";
    const cached = await redisClient.get(key);

    if (!cached) {
      console.log("[v0] DailyGames cache MISS");
      return null;
    }

    console.log("[v0] DailyGames cache HIT");
    return JSON.parse(cached);
  } catch (error) {
    console.error("[v0] Error getting daily games cache:", error);
    return null;
  }
};

/**
 * Guarda en cache los juegos diarios
 */
export const cacheAllDailyGames = async (data) => {
  try {
    const key = "game_stats:DAILY_GAMES:all";
    const ttl = 60 * 60 * 24; // 24 horas

    const dataToCache = {
      ...data,
      cachedAt: new Date().toISOString(),
      fromCache: false,
    };

    await redisClient.set(key, JSON.stringify(dataToCache), { EX: ttl });
    console.log("[v0] DailyGames cache SET with 24h TTL");
    return true;
  } catch (error) {
    console.error("[v0] Error setting daily games cache:", error);
    return false;
  }
};

/**
 * Cache key for coaches
 */
const getCoachesCacheKey = (identifier) => {
  return `coaches:${identifier || "all"}`;
};

/**
 * Get coaches from cache
 */
export const getCoachesCache = async (identifier) => {
  try {
    const key = getCoachesCacheKey(identifier);
    const cached = await redisClient.get(key);

    if (!cached) {
      console.log("[v0] Coaches cache MISS for key:", key);
      return null;
    }

    const parsed = JSON.parse(cached);
    console.log("[v0] Coaches cache HIT for key:", key);
    return parsed.payload;
  } catch (err) {
    console.error("[v0] Error getting coaches cache:", err);
    return null;
  }
};

/**
 * Set coaches in cache
 */
export const setCoachesCache = async (
  identifier,
  data,
  ttl = CACHE_TTL.COACHES
) => {
  try {
    const key = getCoachesCacheKey(identifier);

    const dataToCache = {
      payload: data,
      cachedAt: new Date().toISOString(),
      fromCache: false,
    };

    await redisClient.set(key, JSON.stringify(dataToCache), { EX: ttl });
    console.log("[v0] Coaches cache SET for key:", key);
    return true;
  } catch (err) {
    console.error("[v0] Error setting coaches cache:", err);
    return false;
  }
};

/**
 * Clear coaches cache
 */
export const clearCoachesCache = async (identifier = null) => {
  try {
    const key = identifier ? getCoachesCacheKey(identifier) : "coaches:*";
    const keys = identifier ? [key] : await redisClient.keys("coaches:*");

    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log("[v0] Coaches cache cleared, keys:", keys.length);
    } else {
      console.log("[v0] No coaches cache found to clear");
    }

    return true;
  } catch (err) {
    console.error("[v0] Error clearing coaches cache:", err);
    return false;
  }
};
