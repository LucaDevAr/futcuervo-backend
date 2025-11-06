export async function getFullName(page) {
  try {
    // 1️⃣ Intentar sacar el nombre "Name in home country"
    const fullName = await page
      .$eval(".info-table__content--regular", (els) => {
        const idx = Array.from(els.parentElement.children).findIndex((el) =>
          el.textContent.includes("Name in home country:")
        );
        if (idx >= 0 && els.parentElement.children[idx + 1]) {
          return els.parentElement.children[idx + 1].textContent.trim();
        }
        return null;
      })
      .catch(() => null);

    if (fullName) return fullName;

    // 2️⃣ Fallback: usar displayName del h1
    const displayName = await page
      .$eval("h1.data-header__headline-wrapper", (el) =>
        el.innerText.replace(/#\d+/g, "").trim()
      )
      .catch(() => null);

    return displayName || null;
  } catch (err) {
    console.log("⚠️ getFullName error:", err.message);
    return null;
  }
}
