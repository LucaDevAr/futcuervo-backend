import { findOrCreateClub } from "../findOrCreateClub.js";
import { normalizeClubName, findBestMatch } from "../utils.js";
import { launchBrowser } from "../../browser/launchBrowser.js";

export async function getClubStats(playerUrl, positions = []) {
  const statsUrl = playerUrl.replace("/profil/", "/leistungsdatenverein/");
  console.log("📊 Navegando a stats por club:", statsUrl);

  const { browser, page } = await launchBrowser();
  await page.goto(statsUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const isGoalkeeper = (positions || []).includes("PO");

  const statsData = await page.evaluate((isGoalkeeper) => {
    const parseIntSafe = (t) => {
      const num = parseInt((t || "").replace(/[^0-9]/g, ""), 10);
      return isNaN(num) ? 0 : num;
    };

    const isLowerCategory = (name = "") => {
      const lower = name.toLowerCase();
      return /(u|under)\s?(17|18|19|20|21|22|23)|juvenil|primavera|next\s?gen|reserves|academy|youth|sub-|segunda|filial|castilla/.test(
        lower
      );
    };

    const table = document.querySelector("table.items");
    if (!table) return { clubs: [], totals: {} };

    const rows = Array.from(table.querySelectorAll("tbody tr"));
    const clubs = rows
      .map((row) => {
        const tds = row.querySelectorAll("td");
        if (tds.length < 2) return null;

        const clubName =
          row.querySelector("td:nth-child(2) a")?.textContent?.trim() ||
          row.querySelector("td:nth-child(2)")?.textContent?.trim();

        if (!clubName || isLowerCategory(clubName)) return null;

        if (isGoalkeeper) {
          return {
            clubName,
            appearances: parseIntSafe(tds[2]?.textContent),
            goals: parseIntSafe(tds[3]?.textContent),
            yellowCards: parseIntSafe(tds[4]?.textContent),
            redCards: parseIntSafe(tds[6]?.textContent),
            goalsConceded: parseIntSafe(tds[7]?.textContent),
            cleanSheets: parseIntSafe(tds[8]?.textContent),
          };
        } else {
          return {
            clubName,
            appearances: parseIntSafe(tds[2]?.textContent),
            goals: parseIntSafe(tds[3]?.textContent),
            assists: parseIntSafe(tds[4]?.textContent),
            yellowCards: parseIntSafe(tds[5]?.textContent),
            redCards: parseIntSafe(tds[7]?.textContent),
          };
        }
      })
      .filter(Boolean);

    const totalRow = table.querySelector("tfoot tr");
    let totals = {};
    if (totalRow) {
      totals = {
        appearances: parseIntSafe(totalRow.children[2]?.textContent),
        goals: parseIntSafe(totalRow.children[3]?.textContent),
        assists: parseIntSafe(totalRow.children[4]?.textContent),
        yellowCards: parseIntSafe(totalRow.children[5]?.textContent),
        redCards: parseIntSafe(totalRow.children[7]?.textContent),
      };
    }

    return { clubs, totals };
  }, isGoalkeeper);

  // 🔹 Generar clubDocsByName propio desde stats

  // 🔹 Generar clubDocsByName
  const clubDocsByName = {};
  const allClubNames = statsData.clubs.map((c) => c.clubName);

  for (const clubStat of statsData.clubs) {
    const match =
      findBestMatch(clubStat.clubName, allClubNames) || clubStat.clubName;
    const clubDoc = await findOrCreateClub(match);
    clubDocsByName[normalizeClubName(clubStat.clubName)] = clubDoc;
  }

  // 🔹 Armar clubsStats con los _id
  const clubsStats = {};
  for (const clubStat of statsData.clubs) {
    const normalized = normalizeClubName(clubStat.clubName);
    const clubDoc = clubDocsByName[normalized];

    clubsStats[clubStat.clubName] = {
      club: clubDoc?._id || null,
      clubName: clubStat.clubName,
      appearances: clubStat.appearances,
      assists: clubStat.assists ?? 0,
      yellowCards: clubStat.yellowCards ?? 0,
      redCards: clubStat.redCards ?? 0,
      goals: isGoalkeeper ? undefined : clubStat.goals ?? 0,
      goalsConceded: isGoalkeeper ? clubStat.goalsConceded ?? 0 : undefined,
      cleanSheets: isGoalkeeper ? clubStat.cleanSheets ?? 0 : undefined,
    };
  }

  const totalAppearances = statsData.clubs.reduce(
    (sum, c) => sum + (c.appearances || 0),
    0
  );
  const totalGoals = statsData.clubs.reduce(
    (sum, c) => sum + (c.goals || 0),
    0
  );
  const totalAssists = statsData.clubs.reduce(
    (sum, c) => sum + (c.assists || 0),
    0
  );
  const totalYellowCards = statsData.clubs.reduce(
    (sum, c) => sum + (c.yellowCards || 0),
    0
  );
  const totalRedCards = statsData.clubs.reduce(
    (sum, c) => sum + (c.redCards || 0),
    0
  );

  await browser.close();

  return {
    clubsStats,
    totalAppearances,
    totalGoals,
    totalAssists,
    totalYellowCards,
    totalRedCards,
  };
}
