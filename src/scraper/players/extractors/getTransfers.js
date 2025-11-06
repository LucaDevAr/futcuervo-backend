// getTransfers.js
export async function scrapeTransfersModern(page, playerUrl) {
  try {
    // 🔗 Buscar enlace a la página de transferencias
    const transfersHref = await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll("a")).find((a) =>
        a.href.includes("/transfers/spieler/")
      );
      return link ? link.getAttribute("href") : null;
    });

    let transfersUrl = null;
    const base = new URL(playerUrl).origin;
    if (transfersHref) {
      transfersUrl = transfersHref.startsWith("http")
        ? transfersHref
        : `${base}${transfersHref}`;
    } else {
      // Si no existe, la construimos
      const u = new URL(playerUrl);
      const parts = u.pathname.split("/").filter(Boolean);
      const slug = parts[0];
      const id = parts.at(-1);
      transfersUrl = `${u.origin}/${slug}/transfers/spieler/${id}`;
    }

    console.log("📥 Cargando transferencias desde:", transfersUrl);
    await page.goto(transfersUrl, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    // 🧠 Evaluar el DOM
    const transfers = await page.evaluate(() => {
      const safeText = (sel, root = document) =>
        root.querySelector(sel)?.textContent?.trim() || null;
      const safeAttr = (sel, attr, root = document) =>
        root.querySelector(sel)?.getAttribute(attr) || null;

      const parseDate = (str) => {
        if (!str) return null;
        const [d, m, y] = str.split("/");
        return y && m && d
          ? `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
          : str;
      };

      const isLowerCategory = (name = "") => {
        const lower = name.toLowerCase();
        return /(u|under)\s?(17|18|19|20|22|21|23)|juvenil|primavera|next\s?gen|reserves|academy|youth|sub-|segunda|filial|castilla|yth.|yth|yo|\sc$|\sb$ /.test(
          lower
        );
      };

      const rows = Array.from(
        document.querySelectorAll(".grid.tm-player-transfer-history-grid")
      ).filter((r) => {
        const cls = r.className || "";
        return (
          !cls.includes("--heading") &&
          !cls.includes("--sum") &&
          (r.querySelector(".tm-player-transfer-history-grid__old-club") ||
            r.querySelector(".tm-player-transfer-history-grid__new-club"))
        );
      });

      return rows
        .map((r) => {
          const season = safeText(
            ".tm-player-transfer-history-grid__season",
            r
          );
          const date = parseDate(
            safeText(".tm-player-transfer-history-grid__date", r)
          );

          const fromClubName = safeText(
            ".tm-player-transfer-history-grid__old-club .tm-player-transfer-history-grid__club-link",
            r
          );
          const fromClubLogo = safeAttr(
            ".tm-player-transfer-history-grid__old-club img.tm-player-transfer-history-grid__club-logo",
            "src",
            r
          );
          const fromClubHref = safeAttr(
            ".tm-player-transfer-history-grid__old-club .tm-player-transfer-history-grid__club-link",
            "href",
            r
          );

          const toClubName = safeText(
            ".tm-player-transfer-history-grid__new-club .tm-player-transfer-history-grid__club-link",
            r
          );
          const toClubLogo = safeAttr(
            ".tm-player-transfer-history-grid__new-club img.tm-player-transfer-history-grid__club-logo",
            "src",
            r
          );
          const toClubHref = safeAttr(
            ".tm-player-transfer-history-grid__new-club .tm-player-transfer-history-grid__club-link",
            "href",
            r
          );

          // 🔹 Filtrar transferencias de inferiores
          if (isLowerCategory(fromClubName) || isLowerCategory(toClubName))
            return null;

          return {
            season,
            date,
            from: {
              name: fromClubName,
              logo: fromClubLogo,
              url: fromClubHref
                ? new URL(fromClubHref, location.origin).href
                : null,
            },
            to: {
              name: toClubName,
              logo: toClubLogo,
              url: toClubHref
                ? new URL(toClubHref, location.origin).href
                : null,
            },
          };
        })
        .filter(Boolean);
    });

    return transfers || [];
  } catch (error) {
    console.error("❌ Error extrayendo transferencias:", error.message);
    return [];
  }
}
