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
    httpOnly: false, // se lee en JS
    secure: true, // obligatorio en https
    sameSite: "none", // frontend y backend en subdominios
    path: "/",
    domain: ".futcuervo.com", // 🔥 CLAVE
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

export const clearAuthHintCookie = (res) => {
  res.clearCookie("auth_hint", {
    path: "/",
    domain: ".futcuervo.com",
  });
};
