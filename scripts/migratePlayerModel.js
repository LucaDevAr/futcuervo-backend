/**
 * migratePlayers_v3.js
 * - Maneja múltiples formatos de fecha (string, Date, {$date: ...}, {$numberLong}, timestamps)
 * - Convierte club ids robustamente a ObjectId (new mongoose.Types.ObjectId)
 * - Hace PREVIEW por jugador (imprime career y clubsStats planeados)
 * - Aplica updateOne con $set y $unset
 *
 * USO:
 *  - Primero: poner TEST_ONLY_PLAYER_ID con un _id de prueba (string)
 *  - Revisar logs. Si OK, poner TEST_ONLY_PLAYER_ID = null y ejecutar para todos.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Player from "../src/models/Player.js";
import Club from "../src/models/Club.js";

dotenv.config();
mongoose.set("strictQuery", false);

const SAN_LORENZO_ID = "68429af7587b60bfbe49342b";
// Poné acá un _id de prueba para testear sólo 1 jugador. Usa null para procesar todos.
const TEST_ONLY_PLAYER_ID = null;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB conectado para migración de Players");
  } catch (err) {
    console.error("❌ Error al conectar con MongoDB:", err);
    process.exit(1);
  }
};

/* ---------- Helpers robustos ---------- */

// Normaliza distintos formatos que puede tener una 'fecha' en tu JSON
const parseAnyDate = (raw) => {
  if (!raw) return null;

  // Si ya es Date
  if (raw instanceof Date && !isNaN(raw.getTime())) return raw;

  // Si es string ISO
  if (typeof raw === "string") {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d;
  }

  // Si viene como { $date: "2025-..." } OR { $date: { $numberLong: "..." } }
  if (typeof raw === "object") {
    // { $date: "..." }
    if (raw.$date) {
      // $date puede ser string ISO o número largo
      if (typeof raw.$date === "string") {
        const d = new Date(raw.$date);
        if (!isNaN(d.getTime())) return d;
      } else if (typeof raw.$date === "object" && raw.$date.$numberLong) {
        const ms = parseInt(raw.$date.$numberLong, 10);
        if (!Number.isNaN(ms)) return new Date(ms);
      } else if (typeof raw.$date === "number") {
        const d = new Date(raw.$date);
        if (!isNaN(d.getTime())) return d;
      }
    }

    // Mongo export short form: { "$numberLong": "..." }
    if (raw.$numberLong) {
      const ms = parseInt(raw.$numberLong, 10);
      if (!Number.isNaN(ms)) return new Date(ms);
    }

    // Si recibiste un objeto que es un timestamp en ms
    if (raw.$timestamp && raw.$timestamp.t) {
      // No ideal pero intentamos: $timestamp.t es seconds
      const secs = raw.$timestamp.t;
      return new Date(secs * 1000);
    }
  }

  // Si es número (milis o segundos)
  if (typeof raw === "number") {
    // heurística: si > 10^12 probablemente ms; si <= 10^12 treat as seconds
    if (raw > 1e12) return new Date(raw);
    return new Date(raw * 1000);
  }

  return null;
};

// Convierte safe a ObjectId (soporta _id/$oid/string/ObjectId)
const toObjectIdSafe = (raw) => {
  if (!raw) return null;
  // si ya es ObjectId o string válido
  if (mongoose.isValidObjectId(raw))
    return new mongoose.Types.ObjectId(String(raw));
  // { $oid: "..." } or { _id: "..." } or { _id: { $oid: "..." } }
  if (raw.$oid && mongoose.isValidObjectId(raw.$oid))
    return new mongoose.Types.ObjectId(raw.$oid);
  if (raw._id) {
    const candidate =
      typeof raw._id === "string" ? raw._id : raw._id.$oid || raw._id;
    if (candidate && mongoose.isValidObjectId(candidate))
      return new mongoose.Types.ObjectId(String(candidate));
  }
  return null;
};

/* ---------- Migración ---------- */

const migratePlayers = async () => {
  try {
    const query = TEST_ONLY_PLAYER_ID
      ? { _id: new mongoose.Types.ObjectId(TEST_ONLY_PLAYER_ID) }
      : {};
    const players = await Player.find(query).lean(); // lean: trabajar con POJOs
    console.log(`⚽ Jugadores encontrados para migrar: ${players.length}`);

    const clubs = await Club.find().lean();
    const clubsMap = new Map(
      clubs.map((c) => [String(c._id), c.name || "Desconocido"])
    );

    for (const p of players) {
      console.log(`\n🔄 Preparando: ${p.fullName} (${p._id})`);

      // --- 1) construir career robusto ---
      const originalCareerPath = Array.isArray(p.careerPath)
        ? p.careerPath
        : [];
      const career = [];

      if (originalCareerPath.length > 0) {
        for (const step of originalCareerPath) {
          // step.joinedDate/leftDate podrían estar en múltiples formatos
          const clubId = toObjectIdSafe(step.club);
          const from =
            parseAnyDate(step.joinedDate) || parseAnyDate(p.debutDate) || null;
          const to =
            parseAnyDate(step.leftDate) ||
            parseAnyDate(p.retirementDate) ||
            null;

          // si no hay clubId intentamos no omitir: si no hay clubId y SAN_LORENZO_ID aplicamos (opcional)
          if (clubId) {
            career.push({ club: clubId, from, to });
          } else {
            // si preferís no omitir, descomenta la siguiente línea:
            // career.push({ club: new mongoose.Types.ObjectId(SAN_LORENZO_ID), from, to });
            // por ahora lo OMITIMOS porque no sabemos cual es el club real
          }
        }
      } else if (p.debutDate) {
        // fallback: si no había careerPath creamos 1 etapa en San Lorenzo
        career.push({
          club: new mongoose.Types.ObjectId(SAN_LORENZO_ID),
          from: parseAnyDate(p.debutDate) || null,
          to: parseAnyDate(p.retirementDate) || null,
        });
      }

      // --- 2) clubsStats por cada club único en career (sin duplicados) ---
      const clubsStats = [];
      const seen = new Set();
      for (const step of career) {
        const clubId = step.club;
        if (!clubId) continue;
        const clubIdStr = String(clubId);
        if (seen.has(clubIdStr)) continue;
        seen.add(clubIdStr);

        const clubName = clubsMap.get(clubIdStr) || "Desconocido";
        const isSanLorenzo = clubIdStr === SAN_LORENZO_ID;

        clubsStats.push({
          club: new mongoose.Types.ObjectId(clubIdStr),
          clubName,
          goals: isSanLorenzo ? p.goals || 0 : 0,
          appearances: isSanLorenzo ? p.appearances || 0 : 0,
          assists: 0,
          yellowCards: 0,
          redCards: isSanLorenzo ? p.redCards || 0 : 0,
        });
      }

      // --- 3) totales (suma de clubsStats) ---
      const totalGoals = clubsStats.reduce((s, c) => s + (c.goals || 0), 0);
      const totalAppearances = clubsStats.reduce(
        (s, c) => s + (c.appearances || 0),
        0
      );
      const totalRedCards = clubsStats.reduce(
        (s, c) => s + (c.redCards || 0),
        0
      );

      // --- PREVIEW (loguear lo que vamos a escribir) ---
      console.log("  preview -> career (count):", career.length);
      console.log("  preview -> clubsStats:", clubsStats);
      console.log("  preview -> totals:", {
        totalGoals,
        totalAppearances,
        totalRedCards,
      });

      // Si estás probando y querés parar aquí, podés saltar el update:
      // continue;

      // --- 4) updateOne atómico: set nuevos campos, unset antiguos ---
      const update = {
        $set: {
          career,
          clubsStats,
          totalGoals,
          totalAppearances,
          totalAssists: 0,
          totalYellowCards: 0,
          totalRedCards,
        },
        $unset: {
          careerPath: "",
          goals: "",
          appearances: "",
          redCards: "",
          jerseysUsed: "",
        },
      };

      const res = await Player.updateOne(
        { _id: new mongoose.Types.ObjectId(p._id) },
        update
      );
      console.log(
        `   → updateOne result: matched=${res.matchedCount}, modified=${res.modifiedCount}`
      );
    }

    console.log("\n✅ Migración finalizada.");
  } catch (err) {
    console.error("❌ Error durante migración:", err);
  } finally {
    await mongoose.disconnect();
  }
};

(async () => {
  await connectDB();
  await migratePlayers();
})();
