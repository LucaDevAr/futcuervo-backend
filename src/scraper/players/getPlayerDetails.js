import { launchBrowser } from "../browser/launchBrowser.js";
import chalk from "chalk";
import { getFullName } from "./extractors/getFullName.js";
import { getDisplayName } from "./extractors/getDisplayName.js";
import { getNationality } from "./extractors/getNationality.js";
import { getBirthdate } from "./extractors/getBirthdate.js";
import { getPositions } from "./extractors/getPositions.js";
import { getProfileImage } from "./extractors/getProfileImage.js";
import { scrapeTransfersModern } from "./extractors/getTransfers.js";
import { findOrCreateClub } from "./findOrCreateClub.js";
import { buildCareer } from "./buildCareer.js";
import { getClubStats } from "./extractors/getClubStats.js";

// 🔹 Retry helper para valores críticos
async function getValueStrict(fn, name, retries = 5, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const val = await fn();
      if (val) return val;
    } catch (err) {
      console.log(
        chalk.yellow(
          `⚠️ Error obteniendo ${name}, intento ${i + 1}: ${err.message}`
        )
      );
    }
    await new Promise((res) => setTimeout(res, delayMs + i * 500));
  }
  throw new Error(
    `❌ No se pudo obtener ${name} después de ${retries} intentos`
  );
}

// 🔹 Retry automático de todo el jugador con validación de URLs de clubes
export async function getPlayerDetails(url, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const { browser, page } = await launchBrowser();
    try {
      console.log(
        chalk.cyan(`🔍 Scrapeando jugador: ${url} (Intento ${attempt})`)
      );
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);

      // 🔹 Datos críticos
      const fullName = await getValueStrict(
        () => getFullName(page),
        "fullName"
      );
      const displayName = await getValueStrict(
        () => getDisplayName(page),
        "displayName"
      ).catch(() => fullName);
      const nationality = await getValueStrict(
        () => getNationality(page),
        "nationality"
      ).catch(() => ({ name: null, flagImage: null }));
      const birthdate = await getValueStrict(
        () => getBirthdate(page),
        "birthdate"
      ).catch(() => null);
      const positions =
        (await getValueStrict(() => getPositions(page), "positions").catch(
          () => []
        )) || [];
      const profileImage = await getValueStrict(
        () => getProfileImage(page),
        "profileImage"
      ).catch(() => null);

      // 🔹 Retry interno de transferencias hasta tener todas las URLs de clubs
      let transfers = [];
      let clubDocsByName = {};
      const maxTransferRetries = 5;
      for (let tAttempt = 1; tAttempt <= maxTransferRetries; tAttempt++) {
        transfers = await getValueStrict(
          () => scrapeTransfersModern(page, url),
          "transfers"
        );

        // Verificar clubs sin URL
        const missingClubs = [];
        const clubNames = new Set();
        transfers.forEach((t) => {
          if (t.from?.name) clubNames.add(t.from.name);
          if (t.to?.name) clubNames.add(t.to.name);
        });

        for (const clubName of clubNames) {
          const clubTransfer = transfers.find(
            (t) => t.from?.name === clubName || t.to?.name === clubName
          );
          const urlToUse =
            (clubTransfer?.from?.name === clubName
              ? clubTransfer.from.url
              : null) ||
            (clubTransfer?.to?.name === clubName ? clubTransfer.to.url : null);
          if (!urlToUse) missingClubs.push(clubName);
        }

        if (missingClubs.length === 0) break; // todas las URLs presentes

        console.log(
          chalk.yellow(
            `⚠️ Faltan URLs para clubs: ${missingClubs.join(
              ", "
            )}. Reintentando transferencias (${tAttempt}/${maxTransferRetries})...`
          )
        );
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.waitForTimeout(1500);

        if (tAttempt === maxTransferRetries) {
          throw new Error(
            `❌ No se pudieron obtener URLs de clubs: ${missingClubs.join(
              ", "
            )}`
          );
        }
      }

      // 🔹 Crear clubs
      const clubNames = new Set();
      transfers.forEach((t) => {
        if (t.from?.name) clubNames.add(t.from.name);
        if (t.to?.name) clubNames.add(t.to.name);
      });
      for (const clubName of clubNames) {
        const clubTransfer = transfers.find(
          (t) => t.from?.name === clubName || t.to?.name === clubName
        );
        const urlToUse =
          (clubTransfer?.from?.name === clubName
            ? clubTransfer.from.url
            : null) ||
          (clubTransfer?.to?.name === clubName ? clubTransfer.to.url : null);
        clubDocsByName[clubName] = await findOrCreateClub(clubName, urlToUse);
      }

      // 🔹 Construir carrera y stats
      const career = buildCareer(transfers, clubDocsByName);

      // 🔹 Validación final
      const missingClubsFinal = Object.values(clubDocsByName).filter((c) => !c);
      if (career.length === 0 || missingClubsFinal.length > 0) {
        throw new Error(
          `❌ Datos incompletos: career vacía o clubs no creados, reintentando...`
        );
      }

      let stats = {
        clubsStats: {},
        totalAppearances: 0,
        totalGoals: 0,
        totalAssists: 0,
        totalYellowCards: 0,
        totalRedCards: 0,
      };
      try {
        stats = await getClubStats(url, positions);
      } catch {
        console.log(
          chalk.yellow("⚠️ No se pudieron obtener stats, se usarán vacíos")
        );
      }

      try {
        stats = await getClubStats(url, positions);
      } catch {
        console.log(
          chalk.yellow("⚠️ No se pudieron obtener stats, se usarán vacíos")
        );
      }

      await browser.close();

      // ✅ Retornar solo si todos los datos críticos están presentes
      return {
        fullName,
        displayName,
        nicknames: [],
        birthdate,
        debutDate: null,
        retirementDate: null,
        nationality,
        positions,
        profileImage,
        actionImage: null,
        titles: [],
        career,
        clubsStats: Object.values(stats.clubsStats),
        totalGoals: stats.totalGoals,
        totalAssists: stats.totalAssists,
        totalAppearances: stats.totalAppearances,
        totalYellowCards: stats.totalYellowCards,
        totalRedCards: stats.totalRedCards,
        transfers,
      };
    } catch (err) {
      await browser.close();
      console.log(chalk.yellow(`⚠️ Falló intento ${attempt}: ${err.message}`));
      if (attempt === maxRetries) throw err;
      const wait = 3000 + attempt * 2000;
      console.log(
        chalk.gray(`🔁 Reintentando todo el flujo en ${wait / 1000}s...`)
      );
      await new Promise((res) => setTimeout(res, wait));
    }
  }
}
