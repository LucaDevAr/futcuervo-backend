import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

export const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);
