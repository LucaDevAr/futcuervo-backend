// src/scraper/clubScraper.js
import { chromium } from "playwright";

export const getClubPlayers = async (clubUrl, limit = 0) => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/118.0.5993.90 Safari/537.36",
  });
  const page = await context.newPage();

  await page.goto(clubUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const players = await page.$$eval("table.items > tbody > tr", (rows) => {
    return rows
      .map((row) => {
        const link = row.querySelector("td.posrela td.hauptlink a");
        if (!link) return null;
        const name = link.textContent.replace(/\s+/g, " ").trim();
        const href = link.href;
        return { name, url: href };
      })
      .filter(Boolean);
  });

  await browser.close();

  // 🔹 Filtrar duplicados o nombres vacíos
  let cleanPlayers = Array.from(
    new Map(players.map((p) => [p.url, p])).values()
  );
  // cleanPlayers = cleanPlayers.filter(
  //   (p) => p.name && !p.name.includes("U19") && !p.name.includes("II")
  // );

  // 🔹 Limitar a 3 para
  // cleanPlayers = cleanPlayers.slice(0, limit);

  return cleanPlayers;
};
