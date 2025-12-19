import ClubMember from "../models/ClubMember.js";

export const joinClub = async (req, res) => {
  try {
    const userId = req.user.id;
    const { clubId, role } = req.body;

    if (!clubId || !role) {
      return res.status(400).json({ error: "clubId y role son requeridos" });
    }

    if (!["partner", "supporter"].includes(role)) {
      return res.status(400).json({ error: "Role inválido" });
    }

    // Verificar si ya tiene ese mismo rol en otro club
    const existingRole = await ClubMember.findOne({ userId, role });
    if (existingRole) {
      return res.status(400).json({
        error: `Ya estás unido a un club como ${role}. Solo puedes tener uno.`,
      });
    }

    // Crear membresía
    const member = await ClubMember.create({ userId, clubId, role });

    // 💥 populate
    const populated = await member.populate("clubId");

    return res.json({
      success: true,
      membership: {
        id: populated._id.toString(),
        role: populated.role,
        joinedDate: populated.joinedDate || populated.createdAt,
        points: populated.points ?? 0,
        club: {
          id: populated.clubId._id.toString(),
          name: populated.clubId.name,
          logo: populated.clubId.logo,
          league: populated.clubId.league,
          members: populated.clubId.members,
          points: populated.clubId.points ?? 0,
          updatedAt: populated.clubId.updatedAt,
        },
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error al unirse al club" });
  }
};

export const leaveClub = async (req, res) => {
  try {
    const userId = req.user.id;
    const { clubId, role } = req.body;

    const membership = await ClubMember.findOne({ userId, clubId, role });

    if (!membership) {
      return res.status(403).json({ error: "No estás en este club" });
    }

    // ✅ Usar joinedDate si existe o fallback a createdAt
    const joinedDate = membership.joinedDate || membership.createdAt;

    const diffMs = Date.now() - new Date(joinedDate).getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // ⛔ Si no pasaron 7 días → bloquear
    if (diffDays < 7) {
      const remaining = Math.ceil(7 - diffDays);
      return res.status(400).json({
        error: `Debes esperar ${remaining} día(s) más para salir de este club.`,
      });
    }

    await membership.deleteOne();
    return res.json({ success: true, message: "Has salido del club" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error al salir del club" });
  }
};

export const getMyClubs = async (req, res) => {
  try {
    const userId = req.user.id;

    const clubs = await ClubMember.find({ userId }).populate("clubId");

    res.json(clubs);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error obteniendo tus clubes" });
  }
};
