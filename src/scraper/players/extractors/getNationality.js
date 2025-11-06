export async function getNationality(page) {
  try {
    const nationality = await page.evaluate(() => {
      const img = document.querySelector(
        ".data-header__info-box img.flaggenrahmen"
      );
      const name = img?.alt?.trim() || null;
      const flagImage = img?.src || null;
      return name ? { name, flagImage } : null;
    });

    return nationality || null;
  } catch (err) {
    console.log("⚠️ getNationality error:", err.message);
    return null;
  }
}
