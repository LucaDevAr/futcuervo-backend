// backend/controllers/authController.js
import bcrypt from "bcryptjs";
import fetch from "node-fetch";
import User from "../models/User.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import {
  setAuthCookies,
  clearAuthCookies,
  cookieOptions,
  setAuthHintCookie,
  clearAuthHintCookie,
} from "../utils/cookies.js";
import ClubMember from "../models/ClubMember.js";
import { getAllAttemptsByUser } from "../services/gameStatsService.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// ======================================================================
// REGISTER
// ======================================================================
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Campos requeridos" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Usuario ya existe" });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashed,
      provider: "credentials",
    });

    // PAYLOAD COMPLETO
    const payload = {
      id: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
      image: user.image,
      points: user.points ?? 0,
    };

    const access = signAccessToken(payload);
    const refresh = signRefreshToken({ id: user._id.toString() });
    setAuthCookies(res, access, refresh);
    setAuthHintCookie(res);

    return res.status(201).json({ user: payload });
  } catch (err) {
    console.error("register error", err);
    res.status(500).json({ error: "Error interno" });
  }
};

// ======================================================================
// LOGIN
// ======================================================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email y contraseña requeridos" });

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: "Credenciales inválidas" });

    // PAYLOAD COMPLETO
    const payload = {
      id: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
      image: user.image,
      points: user.points ?? 0,
    };

    const access = signAccessToken(payload);
    const refresh = signRefreshToken({ id: user._id.toString() });

    setAuthCookies(res, access, refresh);
    setAuthHintCookie(res);
    return res.json({ user: payload });
  } catch (err) {
    console.error("login error", err);
    res.status(500).json({ error: "Error interno" });
  }
};

// ======================================================================
// GOOGLE OAUTH REDIRECT
// ======================================================================
export const googleAuthRedirect = (req, res) => {
  const redirectUri = encodeURIComponent(process.env.GOOGLE_REDIRECT_URI);
  const scope = encodeURIComponent("openid profile email");
  const url =
    `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
  return res.redirect(url);
};

// ======================================================================
// GOOGLE CALLBACK
// ======================================================================
export const googleCallback = async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.redirect(`${FRONTEND_URL}/login?error=google`);

    // Your existing logic…
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    }).then((r) => r.json());

    if (!tokenRes.access_token) {
      console.error("google token exchange failed", tokenRes);
      return res.redirect(`${FRONTEND_URL}/auth/error`);
    }

    const userInfo = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenRes.access_token}` },
      }
    ).then((r) => r.json());

    if (!userInfo.email)
      return res.redirect(`${FRONTEND_URL}/login?error=google`);

    // Find or create user
    let user = await User.findOne({
      $or: [{ googleId: userInfo.sub }, { email: userInfo.email }],
    });

    if (!user) {
      user = await User.create({
        name: userInfo.name,
        email: userInfo.email,
        image: userInfo.picture,
        googleId: userInfo.sub,
        provider: "google",
      });
    } else if (!user.googleId) {
      user.googleId = userInfo.sub;
      await user.save();
    }

    // PAYLOAD COMPLETO
    const payload = {
      id: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
      image: user.image,
      points: user.points ?? 0,
    };

    const access = signAccessToken(payload);
    const refresh = signRefreshToken({ id: user._id.toString() });
    setAuthCookies(res, access, refresh);
    setAuthHintCookie(res);
    return res.redirect(`${FRONTEND_URL}`);
  } catch (err) {
    console.error("googleCallback error", err);
    return res.redirect(`${FRONTEND_URL}/auth/error`);
  }
};

// ======================================================================
// SESSION: /auth/me
// ======================================================================
export const me = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ user: null });

    // console.log("[AUTH] /me → usuario:", req.user.id);

    // 🔥 SIEMPRE leer desde MongoDB, nunca desde JWT
    const dbUser = await User.findById(req.user.id).lean();
    if (!dbUser) return res.status(404).json({ user: null });

    const userResponse = {
      id: dbUser._id.toString(),
      role: dbUser.role,
      name: dbUser.name,
      email: dbUser.email,
      image: dbUser.image,
      points: dbUser.points ?? 0,
    };

    const attemptsResult = await getAllAttemptsByUser(req.user.id);

    const memberships = await ClubMember.find(
      { userId: req.user.id },
      { userId: 0, __v: 0 }
    )
      .populate({
        path: "clubId",
        select: "name logo league members points updatedAt",
      })
      .lean();

    const clubMemberships = memberships.map((m) => ({
      id: m._id.toString(),
      role: m.role,
      joinedDate: m.joinedDate || m.createdAt,
      points: m.points ?? 0, // 👈👈👈 FALTABA ESTO
      club: m.clubId
        ? {
            id: m.clubId._id.toString(),
            name: m.clubId.name,
            logo: m.clubId.logo,
            league: m.clubId.league,
            members: m.clubId.members,
            points: m.clubId.points ?? 0,
            updatedAt: m.clubId.updatedAt,
          }
        : null,
    }));

    return res.json({
      user: userResponse,
      attemptsByClub: attemptsResult.attemptsByClub || {},
      totalAttempts: attemptsResult.totalAttempts ?? 0,
      lastUpdated: attemptsResult.lastUpdated ?? null,
      clubMemberships,
    });
  } catch (err) {
    console.error("❌ /auth/me error:", err);
    return res.status(500).json({ error: "Error interno" });
  }
};

// ======================================================================
// LOGOUT
// ======================================================================
export const logout = async (req, res) => {
  try {
    clearAuthCookies(res);
    clearAuthHintCookie(res);
    return res.json({ ok: true });
  } catch (err) {
    console.error("logout error", err);
    res.status(500).json({ error: "Error interno" });
  }
};

// ======================================================================
// REFRESH SESSION
// ======================================================================
export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      return res.status(401).json({ error: "No refresh token" });
    const payload = verifyRefreshToken(refreshToken);
    if (!payload)
      return res.status(401).json({ error: "Invalid refresh token" });

    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    // Nuevo access con points
    const newAccess = signAccessToken({
      id: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
      image: user.image,
      points: user.points ?? 0,
    });

    res.cookie("accessToken", newAccess, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("refresh error", err);
    return res.status(401).json({ error: "Refresh failed" });
  }
};
