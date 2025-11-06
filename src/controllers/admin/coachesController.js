import Coach from "../../models/Coach.js";

// Get all coaches
export const getAllCoaches = async (req, res) => {
  try {
    const coaches = await Coach.find({})
      .populate({
        path: "careerPath.club",
        select: "name logo league",
        populate: {
          path: "league",
          select: "name country",
        },
      })
      .sort({ createdAt: -1 });

    res.json(coaches);
  } catch (error) {
    console.error("Error fetching coaches:", error);
    res.status(500).json({ message: "Error al obtener entrenadores" });
  }
};

// Get single coach by ID
export const getCoachById = async (req, res) => {
  try {
    const { id } = req.params;

    const coach = await Coach.findById(id).populate({
      path: "careerPath.club",
      select: "name logo league",
      populate: {
        path: "league",
        select: "name country",
      },
    });

    if (!coach) {
      return res.status(404).json({ message: "Entrenador no encontrado" });
    }

    res.json(coach);
  } catch (error) {
    console.error("Error fetching coach:", error);
    res.status(500).json({ message: "Error al obtener entrenador" });
  }
};

// Create new coach
export const createCoach = async (req, res) => {
  try {
    const data = req.body;

    // Process dates
    const processedData = {
      ...data,
      birthdate: data.birthdate ? new Date(data.birthdate) : undefined,
      careerPath:
        data.careerPath?.map((career) => ({
          club: career.club,
          joinedDate: career.joinedDate
            ? new Date(career.joinedDate)
            : new Date(),
          leftDate: career.leftDate ? new Date(career.leftDate) : undefined,
        })) || [],
    };

    const coach = new Coach(processedData);
    await coach.save();

    // Populate before returning
    await coach.populate({
      path: "careerPath.club",
      select: "name logo league",
      populate: {
        path: "league",
        select: "name country",
      },
    });

    res.status(201).json(coach);
  } catch (error) {
    console.error("Error creating coach:", error);
    res.status(500).json({ message: "Error al crear entrenador" });
  }
};

// Update coach
export const updateCoach = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Process dates
    const processedData = {
      ...data,
      birthdate: data.birthdate ? new Date(data.birthdate) : undefined,
      careerPath:
        data.careerPath?.map((career) => ({
          club: career.club,
          joinedDate: career.joinedDate
            ? new Date(career.joinedDate)
            : new Date(),
          leftDate: career.leftDate ? new Date(career.leftDate) : undefined,
        })) || [],
    };

    const coach = await Coach.findByIdAndUpdate(id, processedData, {
      new: true,
      runValidators: true,
    }).populate({
      path: "careerPath.club",
      select: "name logo league",
      populate: {
        path: "league",
        select: "name country",
      },
    });

    if (!coach) {
      return res.status(404).json({ message: "Entrenador no encontrado" });
    }

    res.json(coach);
  } catch (error) {
    console.error("Error updating coach:", error);
    res.status(500).json({ message: "Error al actualizar entrenador" });
  }
};

// Delete coach
export const deleteCoach = async (req, res) => {
  try {
    const { id } = req.params;

    const coach = await Coach.findByIdAndDelete(id);

    if (!coach) {
      return res.status(404).json({ message: "Entrenador no encontrado" });
    }

    res.json({ message: "Entrenador eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting coach:", error);
    res.status(500).json({ message: "Error al eliminar entrenador" });
  }
};
