// This mirrors the frontend config to validate gameTypes server-side

export const CLUB_GAMES_CONFIG = {
  general: [
    "national",
    "league",
    "shirt",
    "player",
    "history",
    "video",
    "song",
    "calendar",
    "worldcup",
    "legend",
  ],
  futcuervo: [
    "national",
    "league",
    "shirt",
    "player",
    "history",
    "video",
    "career",
    "appearances",
    "goals",
    "song",
  ],
  barcelona: ["team", "league", "shirt", "player"], // "team" instead of "national", no "song"
  futcule: ["national", "league", "shirt", "player", "history"], // no "song"
};

/**
 * Get valid gameTypes for a club
 * @param {string} clubKey - Club identifier (e.g., "futcuervo", "barcelona", "general")
 * @returns {Array<string>} List of valid gameTypes
 */
export function getClubGameTypes(clubKey = "general") {
  return CLUB_GAMES_CONFIG[clubKey] || CLUB_GAMES_CONFIG.general;
}

/**
 * Validate if a gameType is valid for a club
 * @param {string} clubKey - Club identifier
 * @param {string} gameType - Game type to validate
 * @returns {boolean} true if valid
 */
export function isValidGameType(clubKey, gameType) {
  const validTypes = getClubGameTypes(clubKey);
  return validTypes.includes(gameType);
}

/**
 * Get club key from club ID (you'll need to implement this based on your Club model)
 * For now, returns "general" as fallback
 * @param {string} clubId - MongoDB ObjectId of the club
 * @returns {Promise<string>} Club key (e.g., "futcuervo", "barcelona")
 */
export async function getClubKeyFromId(clubId) {
  if (!clubId) return "general";

  // TODO: Query Club model to get the slug/key
  // const club = await Club.findById(clubId).lean()
  // return club?.slug || "general"

  // For now, return general as fallback
  return "general";
}
