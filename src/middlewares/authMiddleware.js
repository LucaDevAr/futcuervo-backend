// backend/middleware/requireAuth.js
import { verifyAccessToken } from "../utils/jwt.js";

export const requireAuth = (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) return res.status(401).json({ error: "No authenticated" });

    const payload = verifyAccessToken(token);
    if (!payload)
      return res.status(401).json({ error: "Invalid or expired token" });

    // Attach user info to req.user (minimal fields)
    req.user = {
      id: payload.id,
      role: payload.role,
      name: payload.name,
      email: payload.email,
      image: payload.image,
    };

    return next();
  } catch (err) {
    console.error("requireAuth error", err);
    return res.status(401).json({ error: "Auth failed" });
  }
};

export const requireAdmin = (req, res, next) => {
  const token = req.cookies?.accessToken;
  if (!token) return res.status(401).json({ error: "No autenticado" });

  const payload = verifyAccessToken(token);

  if (!payload) return res.status(401).json({ error: "Token inválido" });
  if (payload.role !== "admin")
    return res.status(403).json({ error: "No autorizado" });

  req.user = payload;

  next();
};
