import mongoose from "mongoose";
import fetch from "node-fetch";
import Player from "../models/Player.js";
import { COUNTRY_MAP } from "./constants/countryMap.js";
import { buildCareer } from "./buildCareer.js";
import { isLowerCategory, normalizeClubName } from "./players/utils.js";
import Club from "../models/Club.js";

// ----------------------------
// CONFIG DB
// ----------------------------
const MONGO_URI =
  "mongodb+srv://futcuervo:n2zGIZrlTz2Af8ID@futcuervocluster.7fe9ee0.mongodb.net/futcuervo?retryWrites=true&w=majority&appName=FutCuervoCluster";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch((err) => console.error("❌ Error conectando MongoDB:", err));

// ----------------------------
// CONFIG API
// ----------------------------
const API_BASE = "http://localhost:8000";
const PLAYER_DELAY = 8000;
const INTERNAL_DELAY_MIN = 5000;
const INTERNAL_DELAY_MAX = 10000;
const INITIAL_DELAY_PLAYERS = 5000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sleepRandom = (min, max) =>
  sleep(Math.floor(Math.random() * (max - min)) + min);

// ----------------------------
// POSICIONES
// ----------------------------
const positionMap = {
  Goalkeeper: "PO",
  "Centre-Back": "CT",
  "Left-Back": "LI",
  "Right-Back": "LD",
  "Defensive Midfield": "MCD",
  "Central Midfield": "MC",
  "Right Midfield": "MD",
  "Left Midfield": "MI",
  "Attacking Midfield": "MO",
  "Right Winger": "ED",
  "Left Winger": "EI",
  "Second Striker": "SD",
  "Centre-Forward": "DC",
};

// ----------------------------
// FETCH CON RETRY
// ----------------------------
async function tmFetch(endpoint, attempt = 1) {
  const url = `${API_BASE}${endpoint}`;
  console.log(url);

  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
    });

    if (res.status === 403) {
      if (attempt >= 5) return null;
      const waitTime = Math.min(5000 * attempt, 15000);
      console.warn(
        `⚠️ Rate limit en ${endpoint}, esperando ${waitTime / 1000}s...`
      );
      await sleep(waitTime);
      return tmFetch(endpoint, attempt + 1);
    }

    if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

    const data = await res.json();
    return data;
  } catch (err) {
    if (attempt >= 5) return null;
    console.warn(`⚠️ Error en ${endpoint}, reintentando (${attempt})...`);
    await sleep(2000 * attempt);
    return tmFetch(endpoint, attempt + 1);
  }
}

// ----------------------------
// CACHES
// ----------------------------
const clubCache = new Map();
const playerCache = new Map();

// ----------------------------
// FUNCIONES AUX
// ---------------------------
async function getClubPlayers(clubId) {
  await sleep(INITIAL_DELAY_PLAYERS);
  const data = await tmFetch(`/clubs/${clubId}/players`);
  return data?.players || [];
}

async function getPlayerDetails(playerId) {
  if (playerCache.has(playerId)) return playerCache.get(playerId);

  try {
    const endpoints = [
      `/players/${playerId}/profile`,
      `/players/${playerId}/stats`,
      `/players/${playerId}/transfers`,
    ];
    const results = await Promise.all(
      endpoints.map(async (ep) => {
        await sleepRandom(INTERNAL_DELAY_MIN, INTERNAL_DELAY_MAX);
        return await tmFetch(ep);
      })
    );

    const [profile, stats, transfers] = results;
    console.log(profile);
    const playerData = { profile, stats, transfers };
    playerCache.set(playerId, playerData);
    return playerData;
  } catch (err) {
    console.warn(`⚠️ Error obteniendo jugador ${playerId}: ${err.message}`);
    return null;
  }
}

// ----------------------------
// GUARDAR JUGADOR
// ----------------------------
// ----------------------------
// GUARDAR JUGADOR
// ----------------------------
// ----------------------------
// GUARDAR O ACTUALIZAR JUGADOR
// ----------------------------

async function buildCareerWithRetry(transfers, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    const career = await buildCareer(transfers);
    if (career && career.length > 0) return career;
    console.log(`⚠️ Career vacío, reintentando (${i + 1}/${retries})...`);
    await sleep(delay);
  }
  return []; // Sigue vacío después de los reintentos
}

async function getClubName(clubId) {
  if (clubCache.has(clubId)) return clubCache.get(clubId);
  const data = await tmFetch(`/clubs/${clubId}/profile`);
  if (data?.name) {
    clubCache.set(clubId, data.name);
    return data.name;
  }
  return null;
}

function translateCountry(countryName) {
  if (!countryName) return "Desconocido";

  const match = Object.entries(COUNTRY_MAP).find(
    ([eng]) =>
      eng.toLowerCase() === countryName.toLowerCase() ||
      COUNTRY_MAP[eng].name.toLowerCase() === countryName.toLowerCase()
  );

  return match ? match[1].name : countryName;
}

export async function getOrCreateClub(
  clubName,
  clubId,
  leagueName = "Desconocida"
) {
  if (!clubName || isLowerCategory(clubName)) return null;

  const normalized = normalizeClubName(clubName);
  if (clubCache.has(normalized)) return clubCache.get(normalized);

  let resolvedName = clubName;
  let clubData = null;
  console.log(`clubName: ${clubName}`);
  console.log(`clubId: ${clubId}`);
  // 🧩 Si viene una URL de Transfermarkt, usarla para obtener el nombre completo
  if (clubId) {
    try {
      const API_BASE = "http://localhost:8000";
      const res = await fetch(`${API_BASE}/clubs/${clubId}/profile`);
      if (res.ok) {
        clubData = await res.json();
        resolvedName = clubData.name || clubData.officialName || clubName;
        console.log(`🏷️ Nombre resuelto desde URL: ${resolvedName}`);
      }
    } catch (err) {
      console.warn(
        `⚠️ No se pudo resolver el club desde la URL (${clubUrl}): ${err.message}`
      );
    }
  }

  // Buscar coincidencias flexibles por el nombre resuelto
  let club = await Club.findOne({
    $or: [
      { name: new RegExp(`^${resolvedName}$`, "i") },
      { name: new RegExp(resolvedName, "i") },
    ],
  });
  console.log(resolvedName);
  if (club) {
    console.log(`✅ Club encontrado: ${club.name}`);
  } else {
    // Si no vino clubData de la URL, buscarlo por nombre en la API
    if (!clubData) {
      clubData = await fetchClubDetailsByName(resolvedName);
    }

    let leagueDoc;
    if (clubData) {
      const fullName = clubData.name || clubData.fullName || resolvedName;
      const countryRaw =
        clubData.league?.countryName ||
        clubData.country?.name ||
        clubData.country ||
        "Desconocido";

      const countryEs = translateCountry(countryRaw);
      const leagueReal = clubData.league?.name || leagueName;

      leagueDoc = await getOrCreateLeague(leagueReal, countryEs);

      club = await Club.findOne({ name: new RegExp(fullName, "i") });
      if (!club) {
        club = await Club.create({
          name: fullName,
          league: leagueDoc._id,
          country: countryEs,
          logo: clubData.image || null,
          founded: clubData.foundedOn || null,
        });
        console.log(`🏟️ Club creado con datos reales: ${fullName}`);
      }
    } else {
      leagueDoc = await getOrCreateLeague(leagueName);
      club = await Club.create({ name: resolvedName, league: leagueDoc._id });
      console.log(`🏟️ Club creado sin datos externos: ${resolvedName}`);
    }
  }

  clubCache.set(normalized, club);
  return club;
}

export async function saveOrUpdatePlayer(playerData) {
  try {
    if (!playerData) return null;

    const profile = playerData.profile || {};
    const stats = playerData.stats || {};
    const transfers = playerData.transfers || {};

    // ----------------------------
    // NOMBRES
    // ----------------------------
    const fullName =
      profile.nameInHomeCountry || profile.displayName || profile.name || null;
    const displayName = profile.name || profile.displayName || fullName;
    if (!fullName) return null;

    if (SKIP_EXISTING_PLAYERS) {
      const exists = await Player.exists({ displayName });
      if (exists) {
        console.log(`⏭️ Jugador ya existe en BD, omitiendo: ${displayName}`);
        return null;
      }
    }

    // ----------------------------
    // BIRTHDATE
    // ----------------------------
    const birthdate = (() => {
      const raw = [
        profile.dateOfBirth,
        profile.birthDate,
        profile.birthdate,
        profile.date_of_birth,
        profile.born,
      ];
      for (const f of raw) {
        if (f) {
          const d = new Date(f);
          if (!isNaN(d)) return d;
        }
      }
      if (profile.description) {
        const match = profile.description.match(/(\d{2}\/\d{2}\/\d{4})/);
        if (match) {
          const [day, month, year] = match[1].split("/");
          return new Date(`${year}-${month}-${day}`);
        }
      }
      return null;
    })();

    // ----------------------------
    // NACIONALIDAD
    // ----------------------------
    const nationalityRaw =
      profile.nationality ||
      (profile.citizenship && profile.citizenship[0]) ||
      "Desconocida";
    const key = nationalityRaw.replace(/\s+/g, "").replace(/-/g, "");
    const countryData = COUNTRY_MAP[key] || { name: nationalityRaw, iso: "xx" };

    // ----------------------------
    // BUILD CAREER
    // ----------------------------
    const career = await buildCareerWithRetry(transfers.transfers, 3, 2000);
    if (!career || career.length === 0) {
      console.log(
        `⏭️ Jugador omitido por career vacío tras 3 intentos: ${fullName}`
      );
      return null;
    }

    // ----------------------------
    // STATS POR CLUB Y TOTALES
    // ----------------------------
    const clubStatsMap = new Map();

    if (Array.isArray(stats?.stats)) {
      for (const s of stats.stats) {
        const clubName = await getClubName(s.clubId);
        if (clubName && !isLowerCategory(clubName)) {
          // 🔹 Buscar club en DB y obtener _id
          const clubDoc = await getOrCreateClub(clubName, s.clubId);
          if (!clubDoc) continue;

          if (!clubStatsMap.has(s.clubId)) {
            clubStatsMap.set(s.clubId, {
              club: clubDoc._id, // 🔹 Usamos el ObjectId real
              clubName,
              goals: 0,
              appearances: 0,
              assists: 0,
              yellowCards: 0,
              redCards: 0,
            });
          }

          const cs = clubStatsMap.get(s.clubId);
          cs.goals += s.goals || 0;
          cs.appearances += s.appearances || 0;
          cs.assists += s.assists || 0;
          cs.yellowCards += s.yellowCards || 0;
          cs.redCards += s.redCards || 0;
        }
      }
    }

    const clubsStats = Array.from(clubStatsMap.values());

    // Totales
    const totalGoals = clubsStats.reduce((sum, c) => sum + c.goals, 0);
    const totalAppearances = clubsStats.reduce(
      (sum, c) => sum + c.appearances,
      0
    );
    const totalAssists = clubsStats.reduce((sum, c) => sum + c.assists, 0);
    const totalYellowCards = clubsStats.reduce(
      (sum, c) => sum + c.yellowCards,
      0
    );
    const totalRedCards = clubsStats.reduce((sum, c) => sum + c.redCards, 0);

    // ----------------------------
    // CREAR OBJETO PLAYER
    // ----------------------------
    const playerObj = {
      fullName,
      displayName,
      nicknames: profile.nicknames || [],
      birthdate,
      nationality: {
        name: countryData.name,
        flagImage: `https://flagcdn.com/${countryData.iso}.svg`,
      },
      positions: Array.isArray(profile.positions)
        ? profile.positions
        : profile.position?.main
        ? [positionMap[profile.position.main] || profile.position.main]
        : [],
      profileImage: profile.image || profile.imageUrl || null,
      actionImage: playerData.actionImage || null,
      career,
      clubsStats,
      totalGoals,
      totalAppearances,
      totalAssists,
      totalYellowCards,
      totalRedCards,
    };

    // ----------------------------
    // GUARDAR O ACTUALIZAR EN DB
    // ----------------------------
    let playerDoc = await Player.findOne({ displayName });
    if (playerDoc) {
      Object.assign(playerDoc, playerObj);
      await playerDoc.save();
      console.log(`✅ Jugador actualizado: ${displayName}`);
    } else {
      playerDoc = new Player(playerObj);
      await playerDoc.save();
      console.log(`✅ Jugador creado: ${displayName}`);
    }

    return playerDoc;
  } catch (err) {
    console.error("❌ Error guardando jugador:", err.message);
    return null;
  }
}

// ----------------------------
// SCRAPE CLUB
// ----------------------------
// ----------------------------
// SCRAPE CLUB (con flag para omitir jugadores existentes)
// ----------------------------
const SKIP_EXISTING_PLAYERS = false; // ✅ cambia a false si querés actualizar todos

async function scrapeClub(clubName) {
  try {
    const players = await getClubPlayers("418");
    console.log(`👥 ${players.length} jugadores en ${clubName}`);

    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      console.log(
        `➡️ Procesando jugador ${i + 1}/${players.length}: ${p.name}`
      );

      // 🧠 Obtener datos del jugador
      const details = await getPlayerDetails(p.id);
      if (details) {
        await saveOrUpdatePlayer(details); // Aquí decide crear o actualizar
      } else {
        console.warn(`⚠️ No se pudieron obtener detalles de ${p.name}`);
      }

      await sleep(PLAYER_DELAY);
    }

    console.log("✅ Scrape completo sin errores");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error scrapeando club:", err);
    process.exit(1);
  }
}

// ----------------------------
// EJECUTAR
// ----------------------------
scrapeClub("Real Madrid");
