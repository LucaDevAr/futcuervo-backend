export function buildCareer(transfers, clubDocsByName) {
  if (!transfers || transfers.length === 0) return [];

  // 🔹 Función para parsear fechas mixtas (DD/MM/YYYY o MM/DD/YYYY)
  const parseDate = (str) => {
    if (!str) return null;

    const parts = str.includes("-") ? str.split("-") : str.split("/");
    if (parts.length !== 3) return null;

    let day, month, year;

    // Detectar formato: si el primer número > 12, es DD/MM/YYYY
    if (parseInt(parts[0], 10) > 12) {
      day = parts[0];
      month = parts[1];
      year = parts[2];
    } else if (parseInt(parts[1], 10) > 12) {
      // MM/DD/YYYY
      day = parts[1];
      month = parts[0];
      year = parts[2];
    } else {
      // DD/MM/YYYY por defecto
      day = parts[0];
      month = parts[1];
      year = parts[2];
    }

    const date = new Date(
      `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    );
    return isNaN(date.getTime()) ? null : date;
  };

  // 🔹 Procesar transferencias
  const processed = transfers
    .map((t) => ({ ...t, dateObj: parseDate(t.date) }))
    .filter((t) => t.from?.name && t.to?.name); // ignorar incompletas

  // 🔹 Ordenar cronológicamente por dateObj
  processed.sort((a, b) => a.dateObj - b.dateObj);

  const career = [];

  // 🔹 Primera etapa (desde club origen de la primera transferencia)
  const first = processed[0];
  if (first) {
    career.push({
      club: clubDocsByName[first.from.name]?._id || null,
      name: first.from.name,
      from: null,
      to: first.dateObj,
    });
  }

  // 🔹 Resto de etapas
  for (let i = 0; i < processed.length; i++) {
    const t = processed[i];
    const next = processed[i + 1];

    career.push({
      club: clubDocsByName[t.to.name]?._id || null,
      name: t.to.name,
      from: t.dateObj,
      to: next?.dateObj || null,
    });
  }

  return career;
}
