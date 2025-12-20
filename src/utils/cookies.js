// backend/utils/cookies.js
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // true en prod
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  domain: process.env.NODE_ENV === "production" ? ".futcuervo.com" : undefined,
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
  const baseOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    domain: ".futcuervo.com",
    expires: new Date(0),
  };

  res.setHeader("Set-Cookie", [
    `accessToken=; Expires=${baseOptions.expires.toUTCString()}; Path=/; Domain=.futcuervo.com; HttpOnly; Secure; SameSite=None`,
    `refreshToken=; Expires=${baseOptions.expires.toUTCString()}; Path=/; Domain=.futcuervo.com; HttpOnly; Secure; SameSite=None`,
  ]);
};
