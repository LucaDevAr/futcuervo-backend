import ShirtGame from "../../models/ShirtGame.js";

// @desc Obtener todos los Shirt Games
// @route GET /api/admin/shirt-games
export const getShirtGames = async (req, res) => {
  try {
    const { clubId, generalOnly } = req.query;
    const filter = {};

    if (clubId) {
      filter.clubId = clubId;
    } else if (generalOnly === "true") {
      filter.$or = [{ clubId: null }, { clubId: { $exists: false } }];
    }

    const games = await ShirtGame.find(filter)
      .populate("shirt")
      .populate("clubId")
      .sort({ date: 1 });

    res.json(games);
  } catch (error) {
    console.error("Error al obtener shirt games:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// @desc Crear un nuevo Shirt Game
// @route POST /api/admin/shirt-games
export const createShirtGame = async (req, res) => {
  try {
    const { date, shirt, clubId } = req.body;
    const normalizedDate = new Date(date);
    const normalizedClubId =
      !clubId || clubId === "null" || clubId === "" ? null : clubId;

    // 📌 Validar duplicado por fecha y club
    const existingByDate = await ShirtGame.findOne({
      date: normalizedDate,
      ...(normalizedClubId
        ? { clubId: normalizedClubId }
        : { $or: [{ clubId: null }, { clubId: { $exists: false } }] }),
    });

    if (existingByDate) {
      return res.status(400).json({
        error: "Ya existe un juego para esa fecha y club (o global).",
      });
    }

    // 📌 Validar que la camiseta no esté asignada para el mismo clubId
    const existingByShirt = await ShirtGame.findOne({
      shirt,
      $or: [
        { clubId: normalizedClubId },
        // También se considera igual si ambos no tienen club
        ...(normalizedClubId
          ? []
          : [{ clubId: null }, { clubId: { $exists: false } }]),
      ],
    });

    if (existingByShirt) {
      return res.status(400).json({
        error:
          "Esa camiseta ya está asignada a un juego del mismo club (o global).",
      });
    }

    // ✅ Crear el juego
    let game = await ShirtGame.create({
      date: normalizedDate,
      shirt,
      clubId: normalizedClubId,
    });

    await game.populate([{ path: "shirt" }, { path: "clubId" }]);
    res.status(201).json(game);
  } catch (error) {
    console.error("Error al crear shirt game:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// @desc Actualizar un Shirt Game
// @route PUT /api/admin/shirt-games/:id
export const updateShirtGame = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, shirt, clubId } = req.body;

    const normalizedClubId =
      !clubId || clubId === "null" || clubId === "" ? null : clubId;

    const game = await ShirtGame.findById(id);
    if (!game) {
      return res.status(404).json({ error: "No existe el juego" });
    }

    // 📌 Validar duplicado por fecha y club
    const duplicateDate = await ShirtGame.findOne({
      _id: { $ne: id },
      date: new Date(date),
      ...(normalizedClubId
        ? { clubId: normalizedClubId }
        : { $or: [{ clubId: null }, { clubId: { $exists: false } }] }),
    });

    if (duplicateDate) {
      return res.status(400).json({
        error: "Ya existe otro juego en esa fecha y club (o global).",
      });
    }

    // 📌 Validar que la camiseta no esté usada en otro juego del mismo clubId
    const duplicateShirt = await ShirtGame.findOne({
      _id: { $ne: id },
      shirt,
      $or: [
        { clubId: normalizedClubId },
        ...(normalizedClubId
          ? []
          : [{ clubId: null }, { clubId: { $exists: false } }]),
      ],
    });

    if (duplicateShirt) {
      return res.status(400).json({
        error:
          "Esa camiseta ya está asignada a un juego del mismo club (o global).",
      });
    }

    // ✅ Actualizar
    game.date = new Date(date);
    game.shirt = shirt;
    game.clubId = normalizedClubId;

    await game.save();
    await game.populate([{ path: "shirt" }, { path: "clubId" }]);

    res.json(game);
  } catch (error) {
    console.error("Error al actualizar shirt game:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// @desc Eliminar un Shirt Game
// @route DELETE /api/admin/shirt-games/:id
export const deleteShirtGame = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ShirtGame.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Juego no encontrado" });
    }

    res.json(deleted);
  } catch (error) {
    console.error("Error al eliminar shirt game:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};
