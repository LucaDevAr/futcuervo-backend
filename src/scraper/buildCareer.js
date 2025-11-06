import Club from "../models/Club.js";
import League from "../models/League.js";
import fetch from "node-fetch";
import { isLowerCategory } from "./players/utils.js";
import { COUNTRY_MAP } from "./constants/countryMap.js"; // 👈 importa tu mapa

const clubCache = new Map();
const leagueCache = new Map();

function normalizeName(name) {
  return (
    name
      ?.trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // elimina acentos
      .replace(/[^a-z0-9\s]/g, "") // elimina símbolos
      .replace(/\s+/g, " ") || ""
  );
}
/** Traduce un país en inglés a español usando COUNTRY_MAP */
function translateCountry(countryName) {
  if (!countryName) return "Desconocido";

  const match = Object.entries(COUNTRY_MAP).find(
    ([eng]) =>
      eng.toLowerCase() === countryName.toLowerCase() ||
      COUNTRY_MAP[eng].name.toLowerCase() === countryName.toLowerCase()
  );

  return match ? match[1].name : countryName;
}

/** Busca o crea una liga solo por país */
/** Busca o crea una liga solo por país */
async function getOrCreateLeague(
  leagueName = "Desconocida",
  country = "Desconocido"
) {
  const countryEs = translateCountry(country);
  console.log(`🔎 Buscando liga para country: "${country}" -> "${countryEs}"`);

  const normalizedCountry = normalizeName(countryEs);

  // Revisar cache primero
  if (leagueCache.has(normalizedCountry)) {
    console.log(`♻️ Liga obtenida del cache para country: "${countryEs}"`);
    return leagueCache.get(normalizedCountry);
  }

  // Búsqueda segura por país normalizado
  let league = await League.findOne({
    country: { $regex: new RegExp(`^${countryEs}$`, "i") },
  });

  if (!league) {
    league = await League.create({
      name: leagueName,
      country: countryEs,
    });
    console.log(`🏆 Liga creada: ${leagueName} (${countryEs})`);
  } else {
    console.log(`✅ Liga encontrada: ${league.name} (${league.country})`);
  }

  leagueCache.set(normalizedCountry, league);
  return league;
}

async function fetchClubDetailsByName(clubName) {
  const API_BASE = "http://localhost:8000";

  try {
    // ✅ endpoint corregido
    const res = await fetch(
      `${API_BASE}/clubs/search/${encodeURIComponent(clubName)}?page_number=1`
    );

    if (!res.ok) throw new Error(`Error al buscar club: ${res.statusText}`);

    const data = await res.json();
    const clubs = data.results;

    if (!Array.isArray(clubs) || clubs.length === 0) return null;

    // 🔹 Buscar el club principal (KRC Genk y no U21/U19)
    const found =
      clubs.find(
        (c) =>
          c.name.toLowerCase().includes(clubName.toLowerCase()) &&
          !c.name.toLowerCase().includes("u")
      ) || clubs[0];

    console.log(`🔍 Club seleccionado: ${found.name} (${found.country})`);

    // ✅ endpoint correcto para profile
    const detailsRes = await fetch(`${API_BASE}/clubs/${found.id}/profile`);
    if (!detailsRes.ok) throw new Error(`Error al obtener detalles del club`);

    const details = await detailsRes.json();
    console.log(details);
    return details;
  } catch (err) {
    console.warn(
      `⚠️ No se pudieron obtener detalles del club ${clubName}:`,
      err.message
    );
    return null;
  }
}

/** Busca o crea club correctamente con su liga real */
/** Busca o crea club correctamente con su liga real */
export async function getOrCreateClub(
  clubName,
  clubId,
  leagueName = "Desconocida"
) {
  if (!clubName || isLowerCategory(clubName)) return null;

  const normalized = normalizeName(clubName);
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

/** Convierte fechas de distintos formatos */
/** Convierte fechas de distintos formatos */
function parseTransferDate(t) {
  const candidates = [t.date, t.seasonStartDate, t.seasonEndDate, t.from, t.to];
  for (const raw of candidates) {
    if (!raw) continue;
    if (raw instanceof Date && !isNaN(raw)) return raw;
    if (typeof raw === "string") {
      const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (match) {
        const [, d, m, y] = match;
        const date = new Date(
          `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T00:00:00Z`
        );
        if (!isNaN(date)) return date;
      }
      const d2 = new Date(raw);
      if (!isNaN(d2)) return d2;
    }
  }
  return null;
}

export async function buildCareer(transfers) {
  if (!Array.isArray(transfers)) return [];

  // 1️⃣ Filtrar solo transfers válidos con clubFrom y clubTo
  const filtered = transfers.filter((t) => t.clubFrom?.name && t.clubTo?.name);

  // 2️⃣ Enriquecer con fecha parseada
  const enriched = filtered.map((t) => ({ ...t, _date: parseTransferDate(t) }));

  // 3️⃣ Ordenar por fecha
  enriched.sort(
    (a, b) => (a._date?.getTime() || 0) - (b._date?.getTime() || 0)
  );

  // 4️⃣ Filtrar solo clubes profesionales
  let careerTransfers = enriched.filter(
    (t) => !isLowerCategory(t.clubFrom.name) && !isLowerCategory(t.clubTo.name)
  );

  // Si no hay ninguno profesional, usar el último disponible
  if (careerTransfers.length === 0 && enriched.length > 0) {
    careerTransfers = [enriched[enriched.length - 1]];
  }

  const career = [];

  // 🔹 Agregar el primer club profesional (clubFrom del primer transfer)
  const firstPro = careerTransfers[0];
  if (firstPro?.clubFrom) {
    const firstClubDoc = await getOrCreateClub(
      firstPro.clubFrom.name,
      firstPro.clubFrom.id
    );
    career.push({
      club: firstClubDoc?._id || null,
      name: firstPro.clubFrom.name,
      from: null,
      to: firstPro._date || null,
    });
  }

  // 🔹 Recorrer los transfers
  for (let i = 0; i < careerTransfers.length; i++) {
    const t = careerTransfers[i];
    const next = careerTransfers[i + 1];
    const from = t._date || null;
    const to = next ? next._date || null : null;

    const clubDoc = await getOrCreateClub(t.clubTo.name, t.clubTo.id);

    // Evitar duplicados consecutivos
    const last = career[career.length - 1];
    if (last && last.name === t.clubTo.name) {
      if (!last.to && to) last.to = to;
      continue;
    }

    career.push({
      club: clubDoc?._id || null,
      name: t.clubTo.name,
      from,
      to,
    });
  }

  // Si aún así queda vacío, tomar el último transfer
  if (career.length === 0 && enriched.length > 0) {
    const last = enriched[enriched.length - 1];
    const clubDoc = await getOrCreateClub(last.clubTo.name, last.clubTo.id);
    career.push({
      club: clubDoc?._id || null,
      name: last.clubTo.name,
      from: last._date || null,
      to: null,
    });
  }

  return career;
}
