// controllers/searchPlayersController.js
import connectDB from "../config/db.js";
import Player from "../models/Player.js";

// In-memory cache (lives as long as the server process)
const cache = new Map();
const TTL = 30_000; // 30 seconds

function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export const searchPlayers = async (req, res) => {
  try {
    const query = req.query.query;

    if (!query || query.length < 1) {
      return res.status(200).json({ players: [] });
    }

    const normalized = normalize(query);

    // 1️⃣ Check cache
    const cached = cache.get(normalized);
    const now = Date.now();
    if (cached && now - cached.ts < TTL) {
      return res.status(200).json({ players: cached.data });
    }

    // 2️⃣ Connect to DB
    await connectDB();

    // 3️⃣ Search players (indexed by displayName)
    const players = await Player.find(
      { displayName: { $regex: normalized, $options: "i" } },
      { displayName: 1, positions: 1, nationality: 1, profileImage: 1 }
    )
      .sort({ displayName: 1 })
      .limit(10)
      .lean();

    // 4️⃣ Save to cache
    cache.set(normalized, { data: players, ts: now });

    return res.status(200).json({ players });
  } catch (error) {
    console.error("Error searching players:", error);
    return res.status(500).json({
      error: error.message || "Error searching players",
    });
  }
};
