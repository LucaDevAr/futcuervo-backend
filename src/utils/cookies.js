// backend/utils/cookies.js
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // true en prod
  sameSite: "lax",
  path: "/",
  // maxAge se define por cookie si hace falta
};

export const setAuthCookies = (res, accessToken, refreshToken) => {
  // Access token (vida más larga: 7 días)
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
  });

  // Refresh token (vida muy larga: 30 días)
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
  });
};

export const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });
};
