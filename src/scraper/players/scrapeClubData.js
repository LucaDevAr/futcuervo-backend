import { launchBrowser } from "../browser/launchBrowser.js";

export async function scrapeClubData(transfermarktUrl) {
  const { browser, page } = await launchBrowser();

  await page.goto(transfermarktUrl, { waitUntil: "domcontentloaded" });

  const data = await page.evaluate(() => {
    const name =
      document
        .querySelector(".data-header__headline-wrapper")
        ?.textContent?.trim() || null;
    const logo =
      document.querySelector(".data-header__profile-container img")?.src ||
      null;
    const country =
      document
        .querySelector(".data-header__club-info .flaggenrahmen")
        ?.alt?.trim() || null;
    return { name, logo, country };
  });

  await browser.close();
  return data;
}
