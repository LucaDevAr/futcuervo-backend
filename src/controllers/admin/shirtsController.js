import Shirt from "../../models/Shirt.js";

// Get all shirts with pagination and filters
export const getAllShirts = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1;
    const search = req.query.search || "";
    const type = req.query.type || "";
    const brand = req.query.brand || "";
    const clubId = req.query.clubId || ""; // Agregado filtro por clubId

    const limit = 12;
    const skip = (page - 1) * limit;

    const query = {};

    if (search) {
      query.$or = [
        { brand: { $regex: search, $options: "i" } },
        { sponsors: { $regex: search, $options: "i" } },
        { seasonsUsed: { $regex: search, $options: "i" } },
      ];
    }

    if (type) query.type = type;
    if (brand) query.brand = brand;
    if (clubId) query.clubId = clubId; // Filtrar por clubId si se proporciona

    const total = await Shirt.countDocuments(query);
    const shirts = await Shirt.find(query)
      .sort({ _id: 1 })
      .skip(skip)
      .limit(limit)
      .populate("clubId", "name logo"); // Populate club info

    res.json({
      shirts,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching shirts:", error);
    res.status(500).json({ error: "Error al obtener camisetas" });
  }
};

// Get single shirt by ID
export const getShirtById = async (req, res) => {
  try {
    const { id } = req.params;

    const shirt = await Shirt.findById(id).populate("clubId", "name logo"); // Populate club info

    if (!shirt) {
      return res.status(404).json({ message: "Camiseta no encontrada" });
    }

    res.json(shirt);
  } catch (error) {
    console.error("Error fetching shirt:", error);
    res.status(500).json({ message: "Error al obtener camiseta" });
  }
};

// Create new shirt
export const createShirt = async (req, res) => {
  try {
    const body = req.body;

    // Validación básica
    if (!body.type) {
      return res
        .status(400)
        .json({ error: "El tipo de camiseta es requerido" });
    }

    // Preparar datos
    const shirtData = {
      type: body.type,
      brand: body.brand || "",
      emblemType:
        body.emblemType && ["escudo", "emblema"].includes(body.emblemType)
          ? body.emblemType
          : null, // si no es válido o vacío, poner null
      sponsors: Array.isArray(body.sponsors)
        ? body.sponsors.filter((s) => s && s.trim() !== "")
        : [],
      seasonsUsed: Array.isArray(body.seasonsUsed)
        ? body.seasonsUsed.filter((s) => s && s.trim() !== "")
        : [],
      images: {
        base: (body.images?.base && body.images.base.trim()) || "",
        withoutEmblem:
          (body.images?.withoutEmblem && body.images.withoutEmblem.trim()) ||
          "",
        noSponsors:
          (body.images?.noSponsors && body.images.noSponsors.trim()) || "",
        withSponsors: Array.isArray(body.images?.withSponsors)
          ? body.images.withSponsors.filter((img) => img && img.trim() !== "")
          : [],
      },
      clubId: body.clubId,
    };

    const shirt = new Shirt(shirtData);

    // Validación antes de guardar
    const validationError = shirt.validateSync();
    if (validationError) {
      return res.status(400).json({ error: validationError.message });
    }

    const savedShirt = await shirt.save();

    // Verificar guardado
    const verifyShirt = await Shirt.findById(savedShirt._id).populate(
      "clubId",
      "name logo"
    );

    if (verifyShirt?.emblemType === undefined) {
      return res
        .status(500)
        .json({ error: "Error interno: emblemType no se guardó" });
    }

    res.status(201).json({ success: true, shirt: savedShirt });
  } catch (error) {
    console.error("Error creando camiseta:", error);
    res
      .status(500)
      .json({ error: "Error al crear la camiseta: " + error.message });
  }
};

// Update shirt
export const updateShirt = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    // Ensure emblemType is valid
    if (body.emblemType && !["escudo", "emblema"].includes(body.emblemType)) {
      body.emblemType = "escudo";
    }

    // Clean and structure data
    const shirtData = {
      type: body.type,
      brand: body.brand || "",
      emblemType: body.emblemType || "escudo",
      sponsors: Array.isArray(body.sponsors)
        ? body.sponsors.filter((s) => s && s.trim() !== "")
        : [],
      seasonsUsed: Array.isArray(body.seasonsUsed)
        ? body.seasonsUsed.filter((s) => s && s.trim() !== "")
        : [],
      images: {
        base: (body.images?.base && body.images.base.trim()) || "",
        withoutEmblem:
          (body.images?.withoutEmblem && body.images.withoutEmblem.trim()) ||
          "",
        noSponsors:
          (body.images?.noSponsors && body.images.noSponsors.trim()) || "",
        withSponsors: Array.isArray(body.images?.withSponsors)
          ? body.images.withSponsors.filter((img) => img && img.trim() !== "")
          : [],
      },
      clubId: body.clubId, // Added clubId to shirtData
    };

    const shirt = await Shirt.findByIdAndUpdate(id, shirtData, {
      new: true,
      runValidators: true,
    }).populate("clubId", "name logo"); // Populate club info

    if (!shirt) {
      return res.status(404).json({ message: "Camiseta no encontrada" });
    }

    res.json({ success: true, shirt });
  } catch (error) {
    console.error("Error updating shirt:", error);
    res.status(500).json({
      error: "Error al actualizar la camiseta: " + error.message,
    });
  }
};

// Delete shirt
export const deleteShirt = async (req, res) => {
  try {
    const { id } = req.params;

    const shirt = await Shirt.findByIdAndDelete(id);

    if (!shirt) {
      return res.status(404).json({ message: "Camiseta no encontrada" });
    }

    res.json({ message: "Camiseta eliminada exitosamente" });
  } catch (error) {
    console.error("Error deleting shirt:", error);
    res.status(500).json({ message: "Error al eliminar camiseta" });
  }
};
