import { checkSession } from "../services/sessionService.js";

export const requireAuth = async (req, res, next) => {
  try {
    console.log("[v0] Auth middleware - full request headers:", req.headers);
    console.log("[v0] Auth middleware - cookies:", req.cookies);
    console.log("[v0] Auth middleware - cookie header:", req.headers.cookie);

    const sessionId = req.cookies.sessionId;
    console.log("[v0] Auth middleware - sessionId:", sessionId);

    if (!sessionId) {
      console.log("[v0] Auth middleware - no sessionId found");
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userData = await checkSession(sessionId);
    console.log("[v0] Auth middleware - userData from checkSession:", userData);

    if (!userData) {
      console.log("[v0] Auth middleware - invalid session");
      return res.status(401).json({ error: "Invalid session" });
    }

    // Agregar el usuario al request con ambos formatos para compatibilidad
    req.user = {
      _id: userData.id,
      id: userData.id,
      name: userData.name,
      email: userData.email,
      image: userData.image,
      role: userData.role,
    };

    console.log("[v0] Auth middleware - user added to req:", req.user);
    next();
  } catch (error) {
    console.error("[v0] Auth middleware error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
};

export const requireAdmin = async (req, res, next) => {
  try {
    // First check authentication using existing requireAuth
    const sessionId = req.cookies.sessionId;

    if (!sessionId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const userData = await checkSession(sessionId);

    if (!userData) {
      return res.status(401).json({ error: "Sesión inválida" });
    }

    // Add user to request
    req.user = {
      _id: userData.id,
      id: userData.id,
      name: userData.name,
      email: userData.email,
      image: userData.image,
      role: userData.role,
    };

    // Check if user is admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Acceso denegado. Se requiere rol de administrador" });
    }

    console.log("[v0] Admin middleware - admin user verified:", req.user.email);
    next();
  } catch (error) {
    console.error("[v0] Admin middleware error:", error);
    res.status(403).json({ error: "Acceso denegado" });
  }
};
