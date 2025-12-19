/**
 * Calculates seconds until midnight (local time)
 * This ensures cache expires at day change, not 24h from cache time
 */
export const getSecondsUntilMidnight = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // Next midnight

  const diff = midnight.getTime() - now.getTime();
  return Math.floor(diff / 1000); // Convert to seconds
};

/**
 * Get current date in YYYY-MM-DD format
 */
export const getYYYYMMDD = (date = new Date()) => {
  return date.toISOString().slice(0, 10);
};

/**
 * Check if cached data is from today
 */
export const isCachedToday = (cachedDate) => {
  return cachedDate === getYYYYMMDD();
};
