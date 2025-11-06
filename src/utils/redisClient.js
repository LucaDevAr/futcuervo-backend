import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

// Construimos manualmente la URL de conexión
const redisUrl = `redis://default:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

console.log("[Redis] Intentando conectar a:", redisUrl);

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    // Evita problemas IPv6/DNS en Railway
    family: 0,
    reconnectStrategy: (retries) => {
      console.log(`[Redis] Reintentando conexión… intento #${retries}`);
      return Math.min(retries * 50, 500);
    },
  },
});

// Logs
redisClient.on("connect", () =>
  console.log("[Redis] ✅ Conectado correctamente a Redis")
);
redisClient.on("error", (err) =>
  console.error("[Redis] ❌ Error en Redis:", err)
);

await redisClient.connect();
