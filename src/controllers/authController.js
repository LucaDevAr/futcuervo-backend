import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  createSession,
  deleteSession,
  checkSession,
} from "../services/sessionService.js";

export const register = async (req, res) => {
  try {
    console.log("[v0] Register attempt:", req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario
    const user = new User({
      name,
      email,
      password: hashedPassword,
      provider: "credentials",
    });

    await user.save();
    console.log("[v0] User created:", user._id);

    // Crear sesión
    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role || "user",
    };

    const sessionId = await createSession(user._id.toString(), userData);

    // Configurar cookie de sesión
    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    console.log("[v0] Session created and cookie set:", sessionId);

    res.status(201).json({
      user: userData,
    });
  } catch (error) {
    console.error("[v0] Register error:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const login = async (req, res) => {
  try {
    console.log("[v0] Login attempt:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email y contraseña son requeridos" });
    }

    // Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    console.log("[v0] User authenticated:", user._id);

    // Crear sesión
    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role || "user",
    };

    const sessionId = await createSession(user._id.toString(), userData);

    // Configurar cookie de sesión
    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    console.log("[v0] Session created and cookie set:", sessionId);

    res.json({
      user: userData,
    });
  } catch (error) {
    console.error("[v0] Login error:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const logout = async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;

    if (sessionId) {
      await deleteSession(sessionId);
      console.log("[v0] Session deleted:", sessionId);
    }

    res.clearCookie("sessionId");
    res.json({ message: "Logout exitoso" });
  } catch (error) {
    console.error("[v0] Logout error:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getSession = async (req, res) => {
  try {
    console.log("[v0] getSession - req.cookies:", req.cookies);
    const sessionId = req.cookies.sessionId;

    if (!sessionId) {
      console.log("[v0] getSession - no sessionId found");
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userData = await checkSession(sessionId);
    console.log("[v0] getSession - userData from checkSession:", userData);

    if (!userData) {
      console.log("[v0] getSession - invalid session");
      return res.status(401).json({ error: "Invalid session" });
    }

    res.json(userData);
  } catch (error) {
    console.error("[v0] getSession error:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const googleCallback = async (req, res) => {
  try {
    console.log("[v0] Google callback - req.user:", req.user);

    if (!req.user) {
      console.log("[v0] Google callback - no user data found");
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
    }

    // Check if req.user has nested structure or direct structure
    let user;
    if (req.user.user) {
      // Nested structure: { user: { _id, name, email, ... }, sessionId: ... }
      user = req.user.user;
      console.log("[v0] Google callback - using nested user structure");
    } else if (req.user._id) {
      // Direct structure: { _id, name, email, ... }
      user = req.user;
      console.log("[v0] Google callback - using direct user structure");
    } else {
      console.log("[v0] Google callback - invalid user structure:", req.user);
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
    }

    console.log("[v0] Google callback - extracted user:", user);

    // Crear sesión con los datos del usuario
    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role || "user",
    };

    console.log("[v0] Google callback - userData to store:", userData);

    const sessionId = await createSession(user._id.toString(), userData);

    // Configurar cookie de sesión
    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    console.log("[v0] Google session created and cookie set:", sessionId);

    // Redirigir al frontend
    res.redirect(`${process.env.FRONTEND_URL}/`);
  } catch (error) {
    console.error("[v0] Google callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
  }
};
