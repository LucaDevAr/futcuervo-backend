import { redisClient } from "../utils/redisClient.js";

export const checkSession = async (sessionId) => {
  try {
    if (!sessionId) return null;

    console.log("[v0] checkSession - looking for sessionId:", sessionId);
    const userData = await redisClient.get(`session:${sessionId}`);
    console.log("[v0] checkSession - raw userData from Redis:", userData);

    if (!userData) return null;

    const parsedData = JSON.parse(userData);
    console.log("[v0] checkSession - parsed userData:", parsedData);
    return parsedData;
  } catch (error) {
    console.error("[v0] checkSession error:", error);
    return null;
  }
};

export const createSession = async (userId, userData) => {
  const sessionId = `sess_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  try {
    console.log("[v0] createSession - sessionId:", sessionId);
    console.log("[v0] createSession - userData to store:", userData);

    const serializedData = JSON.stringify(userData);
    console.log("[v0] createSession - serialized data:", serializedData);

    await redisClient.set(`session:${sessionId}`, serializedData, {
      EX: 60 * 60 * 24, // 1 día
    });

    console.log("[v0] createSession - data stored successfully");
    return sessionId;
  } catch (error) {
    console.error("[v0] createSession error:", error);
    throw error;
  }
};

export const deleteSession = async (sessionId) => {
  try {
    await redisClient.del(`session:${sessionId}`);
    console.log("[v0] deleteSession - session deleted:", sessionId);
  } catch (error) {
    console.error("[v0] deleteSession error:", error);
  }
};
