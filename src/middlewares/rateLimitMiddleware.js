import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redisClient } from "../utils/redisClient.js";

// Factory para crear un store con prefix distinto por limiter
const createRedisStore = (prefix) => {
  return new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix,
  });
};

// Global limiter (ligero, solo suaviza tráfico general)
export const globalLimiter = rateLimit({
  store: createRedisStore("rl:global"),
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, slow down",
});

// Auth limiter (login, signup, etc.)
export const authLimiter = rateLimit({
  store: createRedisStore("rl:auth"),
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  skipSuccessfulRequests: true,
  message: "Too many login attempts",
});

// API limiter (requests promedio)
export const apiLimiter = rateLimit({
  store: createRedisStore("rl:api"),
  windowMs: 60 * 1000, // 1 minuto
  max: 60,
  message: "Rate limit exceeded",
});
