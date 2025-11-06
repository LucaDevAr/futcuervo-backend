import Club from "../../models/Club.js";
import League from "../../models/League.js";
import { scrapeClubData } from "./scrapeClubData.js";
import { normalizeClubName } from "./utils.js";
import { COUNTRY_MAP } from "../constants/countryMap.js";

export async function findOrCreateClub(name, transfermarktUrl) {
  if (!name) return null;

  const normalizedInput = normalizeClubName(name);
  const clubs = await Club.find({}).exec();

  // 1. Coincidencia exacta normalizada
  let bestMatch = clubs.find(
    (c) => normalizeClubName(c.name) === normalizedInput
  );
  if (bestMatch) return bestMatch;

  // 2. Coincidencia parcial normalizada
  bestMatch = clubs.find((c) =>
    normalizeClubName(c.name).includes(normalizedInput)
  );
  if (bestMatch) return bestMatch;

  // 3. Si no hay URL, devolvemos null
  if (!transfermarktUrl) {
    console.warn(`⚠️ No hay URL de Transfermarkt para "${name}"`);
    return null;
  }

  // 4. Scrapeamos el club
  const scraped = await scrapeClubData(transfermarktUrl);
  if (!scraped.name) return null;

  const translatedCountry = COUNTRY_MAP[scraped.country] || scraped.country;
  const league = await League.findOne({ country: translatedCountry }).exec();

  if (!league) {
    console.warn(`⚠️ No se encontró liga para ${translatedCountry}`);
    return null;
  }

  const newClub = await Club.create({
    name: scraped.name,
    logo: scraped.logo,
    league: league._id,
  });

  console.log(`✅ Club creado: ${scraped.name}`);
  return newClub;
}
