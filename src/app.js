import dotenv from "dotenv";
dotenv.config({ override: true });
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import compression from "compression"; // Add compression
import connectDB from "./config/db.js";
import {
  globalLimiter,
  authLimiter,
  apiLimiter,
} from "./middlewares/rateLimitMiddleware.js";

// Importar rutas
import authRoutes from "./routes/auth.js";
import gameStatsRoutes from "./routes/gameStatsRoutes.js";
import playersRoutes from "./routes/playersRoutes.js";
import playerRoutes from "./routes/games/playerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import clubsRoutes from "./routes/clubsRoutes.js";
import coachesRoutes from "./routes/coachesRoutes.js";
import shirtGameRoutes from "./routes/games/shirtGameRoutes.js";
import careerGameRoutes from "./routes/games/careerGameRoutes.js";
import dailyGamesRoutes from "./routes/dailyGamesRoutes.js";
import goalsRoutes from "./routes/games/goalsRoutes.js";
import appearancesRoutes from "./routes/games/appearancesRoutes.js";
import shirtRoutes from "./routes/games/shirtRoutes.js";
import nationalTeamRoutes from "./routes/games/nationalTeamRoutes.js";
import leagueTeamRoutes from "./routes/games/leagueTeamGameRoutes.js";
import leagueRoutes from "./routes/admin/leagueRoutes.js";
import videoRoutes from "./routes/admin/videoRoutes.js";
import videoGameRoutes from "./routes/games/videoGameRoutes.js";
import clubMemberRoutes from "./routes/clubMemberRoutes.js";

connectDB();

const app = express();
app.set("trust proxy", 1); // 👈 Necesario en Railway

const DEBUG =
  process.env.NODE_ENV === "development" || process.env.DEBUG_LOGS === "true";

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(cookieParser());

app.use(
  compression({
    level: 6, // Balance between compression ratio and CPU
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

app.use(express.json());
// 🔒 antes de rutas
app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);
app.use(globalLimiter);

// Debug middleware global
app.use((req, res, next) => {
  if (DEBUG) {
    console.log(`[v0] App - ${req.method} ${req.path}`);
  }
  next();
});

// Rutas
// AUTH
app.use("/api/auth", authRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/club-members", clubMemberRoutes);

// STATS
app.use("/api/home/stats", gameStatsRoutes);
app.use("/api/games/goals", goalsRoutes);
app.use("/api/games/appearances", appearancesRoutes);
app.use("/api/games/shirt", shirtRoutes);
app.use("/api/games/player", playerRoutes);

// PLAYERS
app.use("/api/players", playersRoutes);

// CLUBS
app.use("/api/clubs", clubsRoutes);

// COACHES
app.use("/api/coaches", coachesRoutes);

// LEAGUES
app.use("/api/leagues", leagueRoutes);

// VIDEOS
app.use("/api/videos", videoRoutes);

// GAMES - Shirt game routes
app.use("/api/games/shirt", shirtGameRoutes);

// GAMES - Career game routes
app.use("/api/games/career", careerGameRoutes);

// GAMES - National Team game routes
app.use("/api/games/national-team", nationalTeamRoutes);

// GAMES - League Team game routes
app.use("/api/games/league-team", leagueTeamRoutes);

// GAMES - League Team game routes
app.use("/api/games/video", videoGameRoutes);

app.use("/api/games/daily", dailyGamesRoutes);

// Ruta raíz de prueba
app.get("/", (req, res) => {
  res.send("🚀 FutCuervo Backend corriendo con Google Auth!");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use((req, res) => {
  if (DEBUG) {
    console.log(`404 - Route not found: ${req.method} ${req.path}`);
  }
  res.status(404).json({ error: "Route not found" });
});

export default app;
