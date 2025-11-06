export async function getProfileImage(page) {
  try {
    const img = await page.$eval(
      ".data-header__profile-image img, .data-header__profile-image",
      (el) => el.src || el.getAttribute("src")
    );
    return img || null;
  } catch {
    return null;
  }
}
