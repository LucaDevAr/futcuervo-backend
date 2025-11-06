import Player from "../../models/Player.js";

// Get all players with optional pagination and club filter
export const getAllPlayers = async (req, res) => {
  try {
    const { page = 1, limit, clubId } = req.query;
    const skip = (page - 1) * (limit ? parseInt(limit) : 0);

    const query = {};

    // 🔹 Si se envía un clubId, buscar jugadores que tengan ese club en su career
    if (clubId) {
      query["career.club"] = clubId;
    }

    const total = await Player.countDocuments(query);

    let playersQuery = Player.find(query)
      .populate({
        path: "career.club",
        select: "name logo league",
        populate: {
          path: "league",
          select: "name country",
        },
      })
      .populate({
        path: "clubsStats.club",
        select: "name logo",
      })
      .sort({ createdAt: -1 });

    // Aplicar paginación solo si hay límite
    if (limit) {
      playersQuery = playersQuery.skip(skip).limit(parseInt(limit));
    }

    const players = await playersQuery;

    res.json({
      players,
      total,
      page: parseInt(page),
      totalPages: limit ? Math.ceil(total / limit) : 1,
    });
  } catch (error) {
    console.error("Error fetching players:", error);
    res.status(500).json({ message: "Error al obtener jugadores" });
  }
};

// Get single player by ID
export const getPlayerById = async (req, res) => {
  try {
    const { id } = req.params;

    const player = await Player.findById(id)
      .populate({
        path: "career.club",
        select: "name logo league",
        populate: {
          path: "league",
          select: "name country",
        },
      })
      .populate({
        path: "clubsStats.club",
        select: "name logo",
      });

    if (!player) {
      return res.status(404).json({ message: "Jugador no encontrado" });
    }

    res.json(player);
  } catch (error) {
    console.error("Error fetching player:", error);
    res.status(500).json({ message: "Error al obtener jugador" });
  }
};

// Create new player
export const createPlayer = async (req, res) => {
  try {
    const data = req.body;

    const career =
      data.career?.map((period) => ({
        club: period.club,
        from: period.from ? new Date(period.from) : undefined,
        to: period.to ? new Date(period.to) : undefined,
      })) || [];

    const clubsStats =
      data.clubsStats?.map((stat) => ({
        club: stat.club,
        clubName: stat.clubName,
        goals: stat.goals || 0,
        appearances: stat.appearances || 0,
        assists: stat.assists || 0,
        yellowCards: stat.yellowCards || 0,
        redCards: stat.redCards || 0,
      })) || [];

    const processedData = {
      ...data,
      birthdate: data.birthdate ? new Date(data.birthdate) : undefined,
      debutDate: data.debutDate ? new Date(data.debutDate) : undefined,
      retirementDate: data.retirementDate
        ? new Date(data.retirementDate)
        : undefined,
      career,
      clubsStats,
      totalGoals: data.totalGoals || 0,
      totalAppearances: data.totalAppearances || 0,
      totalAssists: data.totalAssists || 0,
      totalYellowCards: data.totalYellowCards || 0,
      totalRedCards: data.totalRedCards || 0,
    };

    const player = new Player(processedData);
    await player.save();

    await player.populate([
      {
        path: "career.club",
        select: "name logo league",
        populate: {
          path: "league",
          select: "name country",
        },
      },
      { path: "clubsStats.club", select: "name logo" },
    ]);

    res.status(201).json(player);
  } catch (error) {
    console.error("Error creating player:", error);
    res.status(500).json({ message: "Error al crear jugador" });
  }
};

// Update player
export const updatePlayer = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const career =
      data.career?.map((period) => ({
        club: period.club,
        from: period.from ? new Date(period.from) : undefined,
        to: period.to ? new Date(period.to) : undefined,
      })) || [];

    const clubsStats =
      data.clubsStats?.map((stat) => ({
        club: stat.club,
        clubName: stat.clubName,
        goals: stat.goals || 0,
        appearances: stat.appearances || 0,
        assists: stat.assists || 0,
        yellowCards: stat.yellowCards || 0,
        redCards: stat.redCards || 0,
      })) || [];

    const processedData = {
      ...data,
      birthdate: data.birthdate ? new Date(data.birthdate) : undefined,
      debutDate: data.debutDate ? new Date(data.debutDate) : undefined,
      retirementDate: data.retirementDate
        ? new Date(data.retirementDate)
        : undefined,
      career,
      clubsStats,
      totalGoals: data.totalGoals || 0,
      totalAppearances: data.totalAppearances || 0,
      totalAssists: data.totalAssists || 0,
      totalYellowCards: data.totalYellowCards || 0,
      totalRedCards: data.totalRedCards || 0,
    };

    const player = await Player.findByIdAndUpdate(id, processedData, {
      new: true,
      runValidators: true,
    }).populate([
      {
        path: "career.club",
        select: "name logo league",
        populate: {
          path: "league",
          select: "name country",
        },
      },
      { path: "clubsStats.club", select: "name logo" },
    ]);

    if (!player) {
      return res.status(404).json({ message: "Jugador no encontrado" });
    }

    res.json(player);
  } catch (error) {
    console.error("Error updating player:", error);
    res.status(500).json({ message: "Error al actualizar jugador" });
  }
};

// Delete player
export const deletePlayer = async (req, res) => {
  try {
    const { id } = req.params;

    const player = await Player.findByIdAndDelete(id);

    if (!player) {
      return res.status(404).json({ message: "Jugador no encontrado" });
    }

    res.json({ message: "Jugador eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting player:", error);
    res.status(500).json({ message: "Error al eliminar jugador" });
  }
};
