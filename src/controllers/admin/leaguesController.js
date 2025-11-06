import League from "../../models/League.js";

// Get all leagues
export const getAllLeagues = async (req, res) => {
  try {
    const leagues = await League.find({}).sort({ name: 1 });
    res.json(leagues);
  } catch (error) {
    console.error("Error fetching leagues:", error);
    res.status(500).json({ message: "Error al obtener ligas" });
  }
};

// Get single league by ID
export const getLeagueById = async (req, res) => {
  try {
    const { id } = req.params;

    const league = await League.findById(id);

    if (!league) {
      return res.status(404).json({ message: "Liga no encontrada" });
    }

    res.json(league);
  } catch (error) {
    console.error("Error fetching league:", error);
    res.status(500).json({ message: "Error al obtener liga" });
  }
};

// Create new league
export const createLeague = async (req, res) => {
  try {
    const body = req.body;

    const league = new League(body);
    await league.save();

    res.status(201).json(league);
  } catch (error) {
    console.error("Error creating league:", error);
    res.status(500).json({
      message: error.message || "Error al crear la liga",
    });
  }
};

// Update league
export const updateLeague = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const league = await League.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!league) {
      return res.status(404).json({ message: "Liga no encontrada" });
    }

    res.json(league);
  } catch (error) {
    console.error("Error updating league:", error);
    res.status(500).json({
      message: error.message || "Error al actualizar la liga",
    });
  }
};

// Delete league
export const deleteLeague = async (req, res) => {
  try {
    const { id } = req.params;

    const league = await League.findByIdAndDelete(id);

    if (!league) {
      return res.status(404).json({ message: "Liga no encontrada" });
    }

    res.json({ message: "Liga eliminada exitosamente" });
  } catch (error) {
    console.error("Error deleting league:", error);
    res.status(500).json({ message: "Error al eliminar liga" });
  }
};
