export const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
  domain: ".futcuervo.com",
};

export const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

export const clearAuthCookies = (res) => {
  // IMPORTANTE: mismo domain + path + flags
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
};

export const setAuthHintCookie = (res) => {
  res.cookie("auth_hint", "1", {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
  });
};

export const clearAuthHintCookie = (res) => {
  res.cookie("auth_hint", "", {
    httpOnly: false,
    expires: new Date(0),
    path: "/",
  });
};
