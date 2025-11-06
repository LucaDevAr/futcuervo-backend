// controllers/searchCoachesController.js
import connectDB from "../config/db.js";
import Coach from "../models/Coach.js";

export const searchCoaches = async (req, res) => {
  try {
    const query = req.query.query;

    if (!query || query.length < 3) {
      return res.status(200).json({ coaches: [] });
    }

    await connectDB();

    // Search coaches by fullName or nicknames
    const coaches = await Coach.find({
      $or: [
        { fullName: { $regex: query, $options: "i" } },
        { nicknames: { $regex: query, $options: "i" } },
      ],
    }).limit(10);

    return res.status(200).json({ coaches });
  } catch (error) {
    console.error("Error searching coaches:", error);
    return res.status(500).json({
      error: error.message || "Error searching coaches",
    });
  }
};
