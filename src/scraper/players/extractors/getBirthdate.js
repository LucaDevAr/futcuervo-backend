export async function getBirthdate(page) {
  try {
    const birthdate = await page.evaluate(() => {
      const birthEl = document.querySelector("a[href*='/datum/']");
      if (!birthEl) return null;
      const match = birthEl.getAttribute("href").match(/(\d{4}-\d{2}-\d{2})/);
      return match ? match[1] : null;
    });
    return birthdate;
  } catch (err) {
    console.log("⚠️ getBirthdate error:", err.message);
    return null;
  }
}
