import { POSITION_MAP } from "../../constants/positionMap.js";

export async function getPositions(page) {
  try {
    const mainPosition = await page
      .$eval(".detail-position__position", (el) => el.textContent.trim())
      .catch(() => null);

    const positionsInField = await page.$$eval(
      ".matchfield__campo .position",
      (els) =>
        els
          .map((el) => {
            const match = el.className.match(
              /position--primary position--([a-z0-9-]+)/i
            );
            return match ? match[1] : null;
          })
          .filter(Boolean)
    );

    const allPositions = [];
    if (mainPosition) allPositions.push(mainPosition);
    allPositions.push(...positionsInField);

    return allPositions
      .map((pos) => POSITION_MAP[pos] || pos)
      .filter((p) => /^[A-Z]{1,3}$/.test(p));
  } catch {
    return [];
  }
}
