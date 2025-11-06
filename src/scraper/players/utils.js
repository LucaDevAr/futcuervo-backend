export function normalizeClubName(name) {
  return (
    name
      ?.toLowerCase()
      .replace(/fc|cf|ac|sc|club/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim() || ""
  );
}

export function isLowerCategory(name = "") {
  if (!name) return false;
  const lower = name.toLowerCase().trim();

  // ⚙️ palabras clave típicas de cantera, filiales o divisiones inferiores
  const lowerPatterns =
    /(u|under)\s?(15|16|17|18|19|20|21|22|23)|juvenil|primavera|reserves?|academy|youth|sub-|segunda|filial|castilla|promesas|b-team|regional|amateur|juveniles|cantera/;

  // ⚙️ equipos B, C, II, III o Next Gen
  const suffixPatterns =
    /\b(b|c|ii|iii)\b(?![a-z])|\bnext\s?gen\b|\byth\b|\batl[eè]tic\s+b\b|\bteam\s*b\b/;

  // ⚙️ nombres de clubes que no son profesionales aunque suenen “normales”
  const knownLowerTeams = [
    "rsc inter fc",
    "rsc inter",
    "alaves b",
    "barcelona b",
    "villarreal b",
    "real sociedad b",
    "real madrid castilla",
    "rm castilla",
    "real madrid c",
    "real madrid u19",
    "real madrid u18",
    "real madrid u17",
    "las palmas athletic",
    "las palmas b",
    "r.madrid yth",
  ];

  if (
    lowerPatterns.test(lower) ||
    suffixPatterns.test(lower) ||
    knownLowerTeams.some((t) => lower.includes(t))
  ) {
    return true;
  }

  return false;
}

// Busca coincidencia aproximada entre un nombre y un listado
export function findBestMatch(name, candidates) {
  const normalized = normalizeClubName(name);
  if (!normalized) return null;

  // 1️⃣ Primero exacta normalizada
  const exact = candidates.find((c) => normalizeClubName(c) === normalized);
  if (exact) return exact;

  // 2️⃣ Luego buscar si el normalized name está contenido en alguno
  const partial = candidates.find((c) =>
    normalizeClubName(c).includes(normalized)
  );
  if (partial) return partial;

  // 3️⃣ Buscar si alguno está contenido en normalized
  return (
    candidates.find((c) => normalized.includes(normalizeClubName(c))) || null
  );
}
