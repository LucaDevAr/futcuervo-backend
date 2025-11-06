// src/scraper/scraperMain.js
import "dotenv/config";
import connectDB from "../config/db.js";
import Player from "../models/Player.js";
import { getClubPlayers } from "./clubScraper.js";
import { getPlayerDetails } from "./players/getPlayerDetails.js";
import chalk from "chalk";

await connectDB();

const clubUrl =
  "https://www.transfermarkt.com/real-madrid/startseite/verein/418";
let players = await getClubPlayers(clubUrl);

console.log(chalk.cyan(`👥 Jugadores encontrados: ${players.length}`));

const delay = (min = 2000, max = 5000) =>
  new Promise((res) =>
    setTimeout(res, Math.floor(Math.random() * (max - min)) + min)
  );

const getPlayerWithRetry = async (url, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await getPlayerDetails(url);
    } catch (err) {
      console.log(chalk.yellow(`⚠️  Error intento ${i + 1}: ${err.message}`));
      if (i < retries - 1) {
        const wait = 3000 + i * 2000;
        console.log(chalk.gray(`🔁 Reintentando en ${wait / 1000}s...`));
        await delay(wait, wait + 500);
      } else {
        console.log(chalk.red(`❌ Falló definitivamente.`));
        throw err;
      }
    }
  }
};

// 🚧 Limitar a 3 jugadores durante pruebas
// players = players.slice(0, 3);

for (const [index, p] of players.entries()) {
  console.log(
    chalk.blue(
      `\n(${index + 1}/${players.length}) ⚽ Creando jugador ${p.name}`
    )
  );
  try {
    const details = await getPlayerDetails(p.url); // retry interno

    await Player.create(details);
    console.log(chalk.green(`✅ Jugador creado: ${details.fullName}`));
  } catch (e) {
    console.log(chalk.red(`❌ Error con ${p.name}: ${e.message}`));
  }

  await delay();
}

console.log(chalk.magenta("\n🏁 Scraping finalizado con éxito"));
process.exit(0);
