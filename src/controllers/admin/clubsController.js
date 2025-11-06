import Club from "../../models/Club.js";

// Get all clubs
export const getAllClubs = async (req, res) => {
  try {
    const clubs = await Club.find({}).populate("league").sort({ name: 1 });
    res.json(clubs);
  } catch (error) {
    console.error("Error fetching clubs:", error);
    res.status(500).json({ message: "Error al obtener clubes" });
  }
};

// Get single club by ID
export const getClubById = async (req, res) => {
  try {
    const { id } = req.params;

    const club = await Club.findById(id).populate("league");

    if (!club) {
      return res.status(404).json({ message: "Club no encontrado" });
    }

    res.json(club);
  } catch (error) {
    console.error("Error fetching club:", error);
    res.status(500).json({ message: "Error al obtener club" });
  }
};

// Create new club
export const createClub = async (req, res) => {
  try {
    const body = req.body;

    const club = new Club(body);
    await club.save();

    // Populate league before returning
    await club.populate("league");

    res.status(201).json(club);
  } catch (error) {
    console.error("Error creating club:", error);
    res.status(500).json({
      message: error.message || "Error al crear el club",
    });
  }
};

// Update club
export const updateClub = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const club = await Club.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).populate("league");

    if (!club) {
      return res.status(404).json({ message: "Club no encontrado" });
    }

    res.json(club);
  } catch (error) {
    console.error("Error updating club:", error);
    res.status(500).json({
      message: error.message || "Error al actualizar el club",
    });
  }
};

// Delete club
export const deleteClub = async (req, res) => {
  try {
    const { id } = req.params;

    const club = await Club.findByIdAndDelete(id);

    if (!club) {
      return res.status(404).json({ message: "Club no encontrado" });
    }

    res.json({ message: "Club eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting club:", error);
    res.status(500).json({ message: "Error al eliminar club" });
  }
};
