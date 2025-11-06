export function getTodayInArgentina() {
  // Devuelve la fecha actual en Argentina (GMT-3)
  const now = new Date();
  // Ajuste de zona horaria: Argentina GMT-3
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const argentinaOffset = -3; // GMT-3
  const argentinaDate = new Date(utc + 3600000 * argentinaOffset);
  return argentinaDate.toISOString().split("T")[0];
}
export function getPreviousDate(days = 1) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}
// src/utils/dateUtils.js
// Utilidades de fecha mínimas para evitar error de importación

export function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

export function getYesterdayString() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
}

export function formatDate(date) {
  return new Date(date).toISOString().split("T")[0];
}
