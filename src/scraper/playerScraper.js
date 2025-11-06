import { chromium } from "playwright";
import Club from "../models/Club.js";
import League from "../models/League.js";
import Player from "../models/Player.js";

const POSITION_MAP = {
  Goalkeeper: "PO",
  "Centre-Back": "CT",
  "Left-Back": "LI",
  "Right-Back": "LD",
  Defender: "CT",
  "Defensive Midfield": "MCD",
  "Central Midfield": "MC",
  "Attacking Midfield": "MO",
  "Left Midfield": "MI",
  "Right Midfield": "MD",
  "Left Winger": "EI",
  "Right Winger": "ED",
  "Second Striker": "SD",
  "Centre-Forward": "DC",
  Striker: "DC",
};

const escapeRegExp = (s = "") => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// SOLO BUSCA en DB, NO crea

export async function findOrCreateClub(name, transfermarktUrl) {
  if (!name) return null;

  // 🔹 Limpiamos el nombre (sin paréntesis, guiones, categorías, etc.)
  const shortName = name
    .split(/ - |\(|\/|,| u19| u20| u17/i)[0]
    .trim()
    .replace(/\s+FC$|CF$|CA$|AC$|SC$|CD$|CFK$/i, "")
    .trim();

  const normalizedInput = shortName.toLowerCase().replace(/[^a-z0-9]/gi, "");

  try {
    // ----------- BÚSQUEDA EN DB ----------------
    const clubs = await Club.find({}).exec();
    let bestMatch = null;
    let bestScore = 0;

    for (const club of clubs) {
      const normalizedClub = club.name.toLowerCase().replace(/[^a-z0-9]/gi, "");

      // 🎯 Exact match => retorno inmediato
      if (normalizedClub === normalizedInput) {
        return club;
      }

      // Coincidencia parcial
      if (
        normalizedClub.includes(normalizedInput) ||
        normalizedInput.includes(normalizedClub)
      ) {
        const score =
          normalizedInput.length / Math.max(normalizedClub.length, 1);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = club;
        }
      }
    }

    if (bestMatch) {
      console.log(
        `🔍 findClubByName: usando coincidencia parcial "${name}" ≈ "${bestMatch.name}"`
      );
      return bestMatch;
    }

    console.warn(
      `⚠️ findClubByName: no se encontró club para "${name}", procediendo a scrapear Transfermarkt`
    );

    // ----------- SCRAPING TRANSFERMARKT -----------
    if (!transfermarktUrl) {
      console.error(
        "❌ No se proporcionó URL de Transfermarkt para crear el club"
      );
      return null;
    }
    console.log(transfermarktUrl);

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(transfermarktUrl, { waitUntil: "domcontentloaded" });

    const fullName = await page.$eval(".data-header__headline-wrapper", (el) =>
      el.textContent.trim()
    );

    const logo = await page.$eval(
      ".data-header__profile-container img",
      (img) => img.src
    );

    const leagueCountry = await page.$eval(
      ".data-header__club-info .flaggenrahmen",
      (img) => img.alt.trim()
    );

    await browser.close();
    // ----------- BUSCAR LIGA EXISTENTE -----------
    const countryMap = {
      // 🇪🇺 Europa
      Germany: "Alemania",
      Spain: "España",
      France: "Francia",
      Italy: "Italia",
      England: "Inglaterra",
      Portugal: "Portugal",
      Netherlands: "Países Bajos",
      Belgium: "Bélgica",
      Switzerland: "Suiza",
      Austria: "Austria",
      Denmark: "Dinamarca",
      Sweden: "Suecia",
      Norway: "Noruega",
      Finland: "Finlandia",
      Poland: "Polonia",
      CzechRepublic: "República Checa",
      Hungary: "Hungría",
      Croatia: "Croacia",
      Serbia: "Serbia",
      Slovenia: "Eslovenia",
      Slovakia: "Eslovaquia",
      Greece: "Grecia",
      Turkey: "Turquía",
      Russia: "Rusia",
      Ukraine: "Ucrania",
      Romania: "Rumania",
      Bulgaria: "Bulgaria",
      Scotland: "Escocia",
      Ireland: "Irlanda",
      Wales: "Gales",
      Iceland: "Islandia",
      BosniaHerzegovina: "Bosnia y Herzegovina",

      // 🇸🇪 Escandinavia y bálticos
      Lithuania: "Lituania",
      Latvia: "Letonia",
      Estonia: "Estonia",

      // 🇦🇷 Sudamérica
      Argentina: "Argentina",
      Brazil: "Brasil",
      Uruguay: "Uruguay",
      Chile: "Chile",
      Paraguay: "Paraguay",
      Bolivia: "Bolivia",
      Peru: "Perú",
      Colombia: "Colombia",
      Ecuador: "Ecuador",
      Venezuela: "Venezuela",

      // 🇲🇽 Norteamérica / Centroamérica / Caribe
      Mexico: "México",
      "United States": "Estados Unidos",
      Canada: "Canadá",
      CostaRica: "Costa Rica",
      Honduras: "Honduras",
      Panama: "Panamá",
      Guatemala: "Guatemala",
      ElSalvador: "El Salvador",
      Jamaica: "Jamaica",

      // 🇮🇳 Asia
      Japan: "Japón",
      SouthKorea: "Corea del Sur",
      China: "China",
      India: "India",
      Iran: "Irán",
      SaudiArabia: "Arabia Saudita",
      Qatar: "Catar",
      UnitedArabEmirates: "Emiratos Árabes Unidos",
      Israel: "Israel",
      Uzbekistan: "Uzbekistán",
      Thailand: "Tailandia",
      Indonesia: "Indonesia",
      Malaysia: "Malasia",
      Vietnam: "Vietnam",
      Kazakhstan: "Kazajistán",

      // 🌍 África
      Egypt: "Egipto",
      SouthAfrica: "Sudáfrica",
      Morocco: "Marruecos",
      Algeria: "Argelia",
      Tunisia: "Túnez",
      Nigeria: "Nigeria",
      Ghana: "Ghana",
      IvoryCoast: "Costa de Marfil",
      Cameroon: "Camerún",
      Senegal: "Senegal",
      DRCongo: "Congo (R.D.)",

      // 🌏 Oceanía
      Australia: "Australia",
      NewZealand: "Nueva Zelanda",
    };

    // Traducimos si es necesario
    const translatedCountry = countryMap[leagueCountry] || leagueCountry;

    // Ahora buscamos la liga usando el país traducido
    const league = await League.findOne({ country: translatedCountry }).exec();
    if (!league) {
      console.warn(
        `⚠️ No se encontró liga en DB para país ${leagueCountry}. Debe crearse manualmente.`
      );
      return null;
    }

    // ----------- CREAR CLUB -----------
    const newClub = await Club.create({
      name: fullName,
      logo,
      league: league._id,
    });

    console.log(`✅ Club creado: ${fullName} (${leagueCountry})`);
    return newClub;
  } catch (err) {
    console.error(`❌ Error findOrCreateClub: ${err.message}`);
    return null;
  }
}

function isLowerCategory(clubName = "") {
  const lower = clubName.toLowerCase();
  return /(u|under)\s?(17|18|19|20|22|21|23)|juvenil|primavera|next\s?gen|reserves|academy|youth|sub-|segunda|filial|castilla|yth.|yth|yo|\sc$|\sb$ /.test(
    lower
  );
}

export const getPlayerDetails = async (url) => {
  console.log("=== Chequeando si el jugador ya existe en DB ===");

  // Intentamos extraer nombre desde la URL como fallback (opcional)
  // Por ejemplo: /dean-huijsen/profil/spieler/890290 -> "dean huijsen"
  const urlNameMatch = url.match(/\/([\w-]+)\/profil\/spieler\/\d+/i);
  const urlName = urlNameMatch ? urlNameMatch[1].replace(/-/g, " ") : null;

  const existingPlayer = await Player.findOne({
    $or: [
      { fullName: new RegExp(`^${urlName}$`, "i") }, // coincidencia insensible a mayúsculas
      { displayName: new RegExp(`^${urlName}$`, "i") },
    ],
  }).exec();

  if (existingPlayer) {
    console.log(
      `🟢 Jugador ya existe en la base de datos: ${existingPlayer.fullName}`
    );
    return existingPlayer; // devolvemos directamente el documento existente
  }

  console.log("🔹 Jugador no encontrado en DB, continuando con scraping...");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0 Safari/537.36",
  });
  const page = await context.newPage();

  console.log("=== Iniciando scraping jugador ===");
  console.log("URL:", url);

  // Navegar al perfil
  await page.goto(url, { waitUntil: "networkidle" }).catch((e) => {
    console.warn("page.goto profile error:", e.message);
  });

  // Asegurarnos que el nombre esté presente
  await page
    .waitForSelector("h1.data-header__headline-wrapper, h1[itemprop='name']", {
      timeout: 15000,
    })
    .catch(() => {
      console.warn("No se encontró el selector de nombre en perfil (timeout).");
    });

  // pequeña espera para hidratación de componentes / JS
  await page.waitForTimeout(2000);

  // Extraer nombre, nacionalidad y - tentativa - transfers dentro del perfil
  const profileData = await page.evaluate((POSITION_MAP) => {
    const safeText = (sel, root = document) =>
      root.querySelector(sel)?.textContent?.trim() || null;

    const displayName =
      (
        safeText("h1.data-header__headline-wrapper") ||
        safeText("h1[itemprop='name']")
      )
        ?.replace(/#[0-9]+/g, "")
        .trim() || null;
    const nationalityImg = document.querySelector(
      ".data-header__info-box img.flaggenrahmen"
    );
    // Buscar “nombre en idioma local”
    let fullName = null;
    const infoItems = Array.from(
      document.querySelectorAll(".info-table__content")
    );
    for (let i = 0; i < infoItems.length; i++) {
      if (infoItems[i].textContent.includes("Name in home country:")) {
        fullName = infoItems[i + 1]?.textContent.trim();
        break;
      }
    }
    const nationality = {
      name: nationalityImg?.alt || "Unknown",
      flagImage: nationalityImg?.src || null,
    };
    const birthHref =
      document.querySelector("a[href*='/datum/']")?.getAttribute("href") ||
      null;
    const birth = birthHref?.match(/(\d{4}-\d{2}-\d{2})/)?.[1] || null;
    const profileImage =
      document.querySelector(".data-header__profile-image")?.src || null;
    const currentClub =
      Array.from(document.querySelectorAll(".info-table__content--bold a"))
        .find((a) => a.href.includes("/startseite/verein/"))
        ?.textContent?.trim() || null;
    // ===== EXTRAER POSICIONES =====
    // Main position
    const mainPosition = document
      .querySelector(".detail-position__position")
      ?.textContent?.trim();

    // Posiciones en campo
    const positionsInField = Array.from(
      document.querySelectorAll(".matchfield__campo .position")
    )
      .map((el) => {
        const match = el.className.match(
          /position--primary position--([a-z0-9-]+)/i
        );
        return match ? match[1] : null;
      })
      .filter(Boolean);

    const allPositions = [];
    if (mainPosition) allPositions.push(mainPosition);
    allPositions.push(...positionsInField);

    // Mapeo y limpieza de posiciones
    const mapped = allPositions
      .map((pos) => POSITION_MAP[pos] || pos)
      .filter((p) => /^[A-Z]{1,3}$/.test(p)); // solo letras tipo PO, DC, MC, etc.

    // Chequear si existe tm-player-transfer-history y su player-id
    const tmComp = document.querySelector("tm-player-transfer-history");
    const playerIdAttr = tmComp?.getAttribute("player-id") || null;

    // Intentamos extraer filas del DOM (si ya están renderizadas)
    const rows = Array.from(
      document.querySelectorAll(".grid.tm-player-transfer-history-grid")
    ).filter((r) => {
      // filtrar encabezado/footer
      const cls = r.className || "";
      if (cls.includes("--heading") || cls.includes("--sum")) return false;
      // debe tener old-club OR new-club
      return (
        r.querySelector(".tm-player-transfer-history-grid__old-club") ||
        r.querySelector(".tm-player-transfer-history-grid__new-club")
      );
    });

    const parseRow = (r) => {
      const season = safeText(".tm-player-transfer-history-grid__season", r);
      const dateStr = safeText(".tm-player-transfer-history-grid__date", r);
      let fromClub =
        safeText(
          ".tm-player-transfer-history-grid__old-club .tm-player-transfer-history-grid__club-link",
          r
        ) ||
        safeText(".tm-player-transfer-history-grid__old-club a", r) ||
        safeText(".tm-player-transfer-history-grid__old-club", r);
      let toClub =
        safeText(
          ".tm-player-transfer-history-grid__new-club .tm-player-transfer-history-grid__club-link",
          r
        ) ||
        safeText(".tm-player-transfer-history-grid__new-club a", r) ||
        safeText(".tm-player-transfer-history-grid__new-club", r);

      // fallback a alt de img
      if (!fromClub)
        fromClub =
          r.querySelector(".tm-player-transfer-history-grid__old-club img")
            ?.alt || null;
      if (!toClub)
        toClub =
          r.querySelector(".tm-player-transfer-history-grid__new-club img")
            ?.alt || null;

      const parseDate = (s) => {
        if (!s) return null;
        const parts = s.split("/");
        if (parts.length === 3) {
          const [m, d, y] = parts;
          return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        }
        return s;
      };

      return {
        season,
        date: parseDate(dateStr),
        fromClub: fromClub?.trim() || null,
        toClub: toClub?.trim() || null,
      };
    };

    const transfersFromDom = rows.map(parseRow);

    // también devolver una posible URL relativa a la página de transfers
    const transfersLinkEl = Array.from(document.querySelectorAll("a")).find(
      (a) => a.href && a.href.includes("/transfers/spieler/")
    );
    const transfersHref = transfersLinkEl
      ? transfersLinkEl.getAttribute("href")
      : null;

    return {
      displayName,
      fullName: fullName || displayName,
      nationality,
      birth,
      profileImage,
      currentClub,
      playerIdAttr,
      transfersFromDom,
      transfersHref,
      positions: mapped, // <- agregado
    };
  }, POSITION_MAP);

  // 🧩 Si el nombre en idioma local tiene caracteres no latinos, lo ignoramos
  const hasNonLatin = /[^\u0000-\u007F]/.test(profileData.fullName || "");
  const finalFullName = hasNonLatin
    ? profileData.displayName
    : profileData.fullName;

  console.log("✅ Página cargada, info básica:");
  console.log("Jugador (displayName):", profileData.displayName);
  console.log("Jugador (finalFullName):", finalFullName);
  console.log("positions:", profileData.positions);
  console.log("playerIdAttr:", profileData.playerIdAttr);
  console.log(
    "transfersHref (link encontrado en perfil):",
    profileData.transfersHref
  );
  console.log(
    "transfersFromDom length:",
    (profileData.transfersFromDom || []).length
  );

  // Si ya extrajo transfers en el perfil, los usamos; si no, navegamos a transfers page
  let transfers = (profileData.transfersFromDom || []).slice();

  // Construir posibles URL de transfers y navegar si no hay filas
  if (!transfers.length) {
    // 1) si existe transfersHref (relativo) lo convertimos a absoluto
    let transfersUrl = null;
    if (profileData.transfersHref) {
      try {
        const base = new URL(url).origin;
        transfersUrl = profileData.transfersHref.startsWith("http")
          ? profileData.transfersHref
          : `${base}${profileData.transfersHref}`;
      } catch (e) {
        transfersUrl = profileData.transfersHref;
      }
    }

    // 2) si tenemos playerIdAttr podemos intentar construir URL usando el slug del perfil (prefiere transfersHref)
    if (!transfersUrl && profileData.playerIdAttr) {
      // intentar obtener slug desde la url original: /<slug>/profil/spieler/<id>
      try {
        const u = new URL(url);
        // pathParts: ["", "dean-huijsen", "profil", "spieler", "890290"]
        const parts = u.pathname.split("/").filter(Boolean);
        // slug es parts[0] normalmente
        const slug = parts[0];
        if (slug) {
          transfersUrl = `${u.origin}/${slug}/transfers/spieler/${profileData.playerIdAttr}`;
        }
      } catch (e) {
        // ignore
      }
    }

    if (transfersUrl) {
      console.log(
        "📥 No había transfers en perfil. Navegando a transfers page:",
        transfersUrl
      );
      await page
        .goto(transfersUrl, { waitUntil: "networkidle" })
        .catch((e) => console.warn("goto transfers page error:", e.message));
      await page.waitForTimeout(1500);

      // Extraer transfers desde la página de transfers (DOM "plano")
      const transfersOnTransfersPage = await page.evaluate(() => {
        const safeText = (sel, root = document) =>
          root.querySelector(sel)?.textContent?.trim() || null;

        const rows = Array.from(
          document.querySelectorAll(".grid.tm-player-transfer-history-grid")
        ).filter((r) => {
          const cls = r.className || "";
          if (cls.includes("--heading") || cls.includes("--sum")) return false;
          return (
            r.querySelector(".tm-player-transfer-history-grid__old-club") ||
            r.querySelector(".tm-player-transfer-history-grid__new-club")
          );
        });

        const parseDate = (s) => {
          if (!s) return null;
          const parts = s.split("/");
          if (parts.length === 3) {
            const [m, d, y] = parts;
            return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
          }
          return s;
        };

        return rows.map((r) => {
          const season = safeText(
            ".tm-player-transfer-history-grid__season",
            r
          );
          const dateStr = safeText(".tm-player-transfer-history-grid__date", r);
          let fromClub =
            safeText(
              ".tm-player-transfer-history-grid__old-club .tm-player-transfer-history-grid__club-link",
              r
            ) ||
            safeText(".tm-player-transfer-history-grid__old-club a", r) ||
            safeText(".tm-player-transfer-history-grid__old-club", r);

          let fromClubRelative =
            r
              .querySelector(
                ".tm-player-transfer-history-grid__old-club .tm-player-transfer-history-grid__club-link"
              )
              ?.getAttribute("href") ||
            r
              .querySelector(".tm-player-transfer-history-grid__old-club a")
              ?.getAttribute("href") ||
            null;

          let fromClubUrl = fromClubRelative
            ? new URL(fromClubRelative, window.location.origin).href
            : null;

          let toClub =
            safeText(
              ".tm-player-transfer-history-grid__new-club .tm-player-transfer-history-grid__club-link",
              r
            ) ||
            safeText(".tm-player-transfer-history-grid__new-club a", r) ||
            safeText(".tm-player-transfer-history-grid__new-club", r);
          // 🔹 Extraer URL relativa y convertirla en absoluta
          let toClubRelative =
            r
              .querySelector(
                ".tm-player-transfer-history-grid__new-club .tm-player-transfer-history-grid__club-link"
              )
              ?.getAttribute("href") ||
            r
              .querySelector(".tm-player-transfer-history-grid__new-club a")
              ?.getAttribute("href") ||
            null;

          let toClubUrl = toClubRelative
            ? new URL(toClubRelative, window.location.origin).href
            : null;

          // 🔹 Mostrar en consola del navegador (lo vas a ver reflejado en logs de Node)
          if (toClubUrl)
            console.log(`[DEBUG transfers] Club URL detectada: ${toClubUrl}`);

          if (!fromClub)
            fromClub =
              r.querySelector(".tm-player-transfer-history-grid__old-club img")
                ?.alt || null;
          if (!toClub)
            toClub =
              r.querySelector(".tm-player-transfer-history-grid__new-club img")
                ?.alt || null;

          return {
            season,
            date: parseDate(dateStr),
            fromClub: fromClub?.trim() || null,
            fromClubUrl,
            toClub: toClub?.trim() || null,
            toClubUrl,
          };
        });
      });

      console.log(
        "transfersOnTransfersPage length:",
        transfersOnTransfersPage.length
      );
      transfers = transfersOnTransfersPage;
    } else {
      console.log(
        "⚠️ No pudimos construir transfersUrl (no href ni playerId). No hay transfers."
      );
    }
  } else {
    console.log("✅ Usando transfers extraídos del perfil (DOM).");
  }

  console.log("⚽ Transfers encontrados (final):", transfers.length);
  console.log(
    "DEBUG transfers sample (first 6):",
    JSON.stringify(transfers.slice(0, 6), null, 2)
  );

  // --- Construir career a partir de transfers ---
  // 1) ordenar cronológicamente (antiguo -> nuevo)
  const transfersOrdered = (transfers || []).slice().sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return -1;
    if (!b.date) return 1;
    return new Date(a.date) - new Date(b.date);
  });

  console.log("DEBUG: transfersOrdered length =", transfersOrdered.length);

  // 2) recolectar nombres únicos (para resoluciones DB, opcional)
  const clubNamesSet = new Set();
  if (transfersOrdered.length > 0) {
    const first = transfersOrdered[0];
    if (first.fromClub) clubNamesSet.add(first.fromClub);
  }
  transfersOrdered.forEach((t) => {
    if (t.toClub) clubNamesSet.add(t.toClub);
    if (t.fromClub) clubNamesSet.add(t.fromClub);
  });
  const clubNameArray = Array.from(clubNamesSet);
  console.log("DEBUG: club names detected:", clubNameArray);

  // 3) Buscar clubs en DB (sin crear). Esto nos da objectIds cuando existan.
  // --- Construir mapa de transfers por nombre de club ---
  const transferMapByName = {};
  transfersOrdered.forEach((t) => {
    if (t.toClub) {
      transferMapByName[t.toClub] = t; // guardamos el objeto completo para usar toClubUrl
    }
    if (t.fromClub && !transferMapByName[t.fromClub]) {
      transferMapByName[t.fromClub] = t; // guardamos fromClub (opcionalmente)
    }
  });

  // --- Buscar clubs en DB / crear si hace falta ---
  const clubDocsByName = {};
  await Promise.all(
    clubNameArray.map(async (name) => {
      const transferInfo = transferMapByName[name] || {};
      const clubUrl =
        transferInfo.toClubUrl || transferInfo.fromClubUrl || null;

      try {
        if (isLowerCategory(name)) return null;

        let doc = null;
        try {
          doc = await findOrCreateClub(name, clubUrl);
        } catch (err) {
          console.error(
            `❌ Error findOrCreateClub para "${name}": ${err.message}`
          );
        }

        if (!doc) {
          // ⚠️ Forzamos un placeholder para no cortar el proceso del jugador
          clubDocsByName[name] = { _id: null, name };
          console.warn(
            `⚠️ Club no encontrado, usando placeholder para "${name}"`
          );
        } else {
          clubDocsByName[name] = doc;
          console.log(`✅ Club encontrado o creado -> "${name}"`);
        }
      } catch (err) {
        console.error(
          `❌ Error findOrCreateClub para "${name}": ${err.message}`
        );
        clubDocsByName[name] = null;
      }
    })
  );

  // 4) Construir career:
  // - Primer elemento: primer fromClub (si existe) => from: null, to: fechaPrimeraTransfer
  // - Luego, para cada transferencia cronológica: crear entrada para toClub:
  //     { club: clubId||null, name: toClub, from: fechaTransfer, to: fechaSiguiente || null }
  const career = [];

  if (transfersOrdered.length > 0 && transfersOrdered[0].fromClub) {
    const first = transfersOrdered[0];
    const firstDate = first.date ? new Date(first.date) : null;
    const clubDoc = clubDocsByName[first.fromClub] || null;
    console.log(
      `DEBUG: Adding initial career entry -> ${
        first.fromClub
      } (from: null, to: ${firstDate}, clubId: ${clubDoc?._id ?? "null"})`
    );
    career.push({
      club: clubDoc?._id || null,
      name: first.fromClub,
      from: null,
      to: firstDate,
    });
  } else {
    console.log("DEBUG: No initial fromClub found in first transfer row.");
  }

  for (let i = 0; i < transfersOrdered.length; i++) {
    const t = transfersOrdered[i];
    const next = transfersOrdered[i + 1];
    if (!t.toClub) {
      console.log(
        `DEBUG: skipping transfer idx=${i} because toClub is missing (fromClub="${t.fromClub}", date="${t.date}")`
      );
      continue;
    }
    const fromDate = t.date ? new Date(t.date) : null;
    const toDate = next?.date ? new Date(next.date) : null;
    const clubDoc = clubDocsByName[t.toClub] || null;
    console.log(
      `DEBUG: Adding career entry idx=${i} -> name="${
        t.toClub
      }" from=${fromDate} to=${toDate} clubId=${clubDoc?._id ?? "null"}`
    );
    career.push({
      club: clubDoc?._id || null,
      name: t.toClub,
      from: fromDate,
      to: toDate,
    });
  }

  const filteredCareer = career.filter((c) => !isLowerCategory(c.name));
  console.log(
    "DEBUG: Final career array:",
    JSON.stringify(filteredCareer, null, 2)
  );

  // === SCRAPING DE STATS POR CLUB ===
  const statsUrl = url.replace("/profil/", "/leistungsdatenverein/");
  console.log("📊 Navegando a stats por club:", statsUrl);

  await page
    .goto(statsUrl, { waitUntil: "networkidle" })
    .catch((e) => console.warn("stats page error:", e.message));
  await page.waitForTimeout(1500);

  const isGoalkeeper = (profileData.positions || []).includes("PO");

  const statsData = await page.evaluate((isGoalkeeper) => {
    const parseIntSafe = (t) => {
      const num = parseInt((t || "").replace(/[^0-9]/g, ""), 10);
      return isNaN(num) ? 0 : num;
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
      if (isGoalkeeper) {
        totals = {
          appearances: parseIntSafe(totalRow.children[2]?.textContent),
          goals: parseIntSafe(totalRow.children[3]?.textContent),
          yellowCards: parseIntSafe(totalRow.children[4]?.textContent),
          redCards: parseIntSafe(totalRow.children[6]?.textContent),
          goalsConceded: parseIntSafe(totalRow.children[7]?.textContent),
          cleanSheets: parseIntSafe(totalRow.children[8]?.textContent),
        };
      } else {
        totals = {
          appearances: parseIntSafe(totalRow.children[2]?.textContent),
          goals: parseIntSafe(totalRow.children[3]?.textContent),
          assists: parseIntSafe(totalRow.children[4]?.textContent),
          yellowCards: parseIntSafe(totalRow.children[5]?.textContent),
          redCards: parseIntSafe(totalRow.children[7]?.textContent),
        };
      }
    }

    return { clubs, totals };
  }, isGoalkeeper);

  const filteredClubStats = (statsData?.clubs || []).filter(
    (c) => !isLowerCategory(c.clubName)
  );

  // === MERGEAR CLUBS STATS ==

  const clubsStatsMap = {};
  for (const clubStat of filteredClubStats) {
    // buscar club en DB usando findClubByName
    const clubDoc = await findOrCreateClub(clubStat.clubName);

    clubsStatsMap[clubStat.clubName] = {
      club: clubDoc?._id || null,
      clubName: clubStat.clubName,
      appearances: clubStat.appearances,
      assists: clubStat.assists,
      yellowCards: clubStat.yellowCards,
      redCards: clubStat.redCards,
      goals: isGoalkeeper ? undefined : clubStat.goals,
    };
  }

  // Totales finales
  // ✅ Recalcular totales solo con clubes válidos (no inferiores)
  const validClubStats = (statsData?.clubs || []).filter(
    (c) => !isLowerCategory(c.clubName)
  );

  const totalAppearances = validClubStats.reduce(
    (sum, c) => sum + (c.appearances || 0),
    0
  );
  const totalAssists = validClubStats.reduce(
    (sum, c) => sum + (c.assists || 0),
    0
  );
  const totalYellowCards = validClubStats.reduce(
    (sum, c) => sum + (c.yellowCards || 0),
    0
  );
  const totalRedCards = validClubStats.reduce(
    (sum, c) => sum + (c.redCards || 0),
    0
  );
  const totalGoals = validClubStats.reduce((sum, c) => sum + (c.goals || 0), 0);

  console.log("✅ clubsStats final:", clubsStatsMap);

  await browser.close();
  // Montar objeto final
  return {
    fullName: finalFullName || profileData.displayName,
    displayName: profileData.displayName || null,
    nicknames: [],
    birthdate: profileData.birth ? new Date(profileData.birth) : null,
    debutDate: null,
    retirementDate: null,
    nationality: profileData.nationality,
    positions: profileData.positions || [],
    profileImage: profileData.profileImage,
    actionImage: null,
    placeOfBirth: null,
    height: null,
    currentClub: profileData.currentClub,
    titles: [],
    career: filteredCareer,
    clubsStats: Object.values(clubsStatsMap),
    totalGoals,
    totalAppearances,
    totalAssists,
    totalYellowCards,
    totalRedCards,
  };
};
