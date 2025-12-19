import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

const {
  REDIS_PASSWORD,
  REDIS_HOST = "127.0.0.1",
  REDIS_PORT = "6379",
} = process.env;

// Construcción segura de la URL
const redisUrl = REDIS_PASSWORD
  ? `redis://default:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`
  : `redis://${REDIS_HOST}:${REDIS_PORT}`;

// console.log("[Redis] Intentando conectar a:", redisUrl);

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    family: 0,
    reconnectStrategy: (retries) => {
      // console.log(`[Redis] Reintentando conexión… intento #${retries}`);
      return Math.min(retries * 50, 500);
    },
  },
});

redisClient.on("connect", () => {
  // console.log("[Redis] ✅ Conectado correctamente a Redis");
});
redisClient.on("error", (err) =>
  console.error("[Redis] ❌ Error en Redis:", err)
);

await redisClient.connect();
