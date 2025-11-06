export async function getDisplayName(page) {
  try {
    const name = await page.$eval(
      "h1.data-header__headline-wrapper, h1[itemprop='name']",
      (el) => {
        // Extrae texto completo del encabezado, limpia saltos de línea y número de camiseta
        let text = el.innerText || el.textContent || "";
        text = text.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
        // Elimina número de camiseta tipo "#1"
        text = text.replace(/^#\d+\s*/, "").trim();
        return text || null;
      }
    );

    return name || null;
  } catch (err) {
    console.error("Error al obtener displayName:", err.message);
    return null;
  }
}
