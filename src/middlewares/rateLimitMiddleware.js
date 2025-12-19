import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redisClient } from "../utils/redisClient.js";

const redisStore = new RedisStore({
  sendCommand: (...args) => redisClient.sendCommand(args),
});

export const globalLimiter = rateLimit({
  store: redisStore,
  windowMs: 15 * 60 * 1000,
  max: 300, // global soft limit
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests",
});

export const authLimiter = rateLimit({
  store: redisStore,
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: "Too many login attempts",
});

export const apiLimiter = rateLimit({
  store: redisStore,
  windowMs: 60 * 1000,
  max: 60, // 1 req/sec promedio
  message: "Rate limit exceeded",
});
