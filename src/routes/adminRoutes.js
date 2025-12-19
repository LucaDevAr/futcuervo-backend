import express from "express";
import { requireAdmin } from "../middlewares/authMiddleware.js";

// Import all admin controllers
import * as playersController from "../controllers/admin/playersController.js";
import * as clubsController from "../controllers/admin/clubsController.js";
import * as coachesController from "../controllers/admin/coachesController.js";
import * as leaguesController from "../controllers/admin/leaguesController.js";
import * as shirtsController from "../controllers/admin/shirtsController.js";
import * as videoController from "../controllers/admin/videoController.js";
import * as shirtGameController from "../controllers/games/shirtGameController.js";
import * as usersController from "../controllers/admin/usersController.js";
import * as gamesController from "../controllers/admin/gamesController.js";
import * as countriesController from "../controllers/admin/countriesController.js";
import * as videoGameController from "../controllers/games/videoGameController.js";

const router = express.Router();

// Apply admin middleware to all routes
router.use(requireAdmin);

// ===== PLAYERS ROUTES =====
router.get("/players", playersController.getAllPlayers);
router.get("/players/:id", playersController.getPlayerById);
router.post("/players", playersController.createPlayer);
router.put("/players/:id", playersController.updatePlayer);
router.delete("/players/:id", playersController.deletePlayer);

// ===== CLUBS ROUTES =====
router.get("/clubs", clubsController.getAllClubs);
router.get("/clubs/:id", clubsController.getClubById);
router.post("/clubs", clubsController.createClub);
router.put("/clubs/:id", clubsController.updateClub);
router.delete("/clubs/:id", clubsController.deleteClub);

// ===== COACHES ROUTES =====
router.get("/coaches", coachesController.getAllCoaches);
router.get("/coaches/:id", coachesController.getCoachById);
router.post("/coaches", coachesController.createCoach);
router.put("/coaches/:id", coachesController.updateCoach);
router.delete("/coaches/:id", coachesController.deleteCoach);

// ===== LEAGUES ROUTES =====
router.get("/leagues", leaguesController.getAllLeagues);
router.get("/leagues/:id", leaguesController.getLeagueById);
router.post("/leagues", leaguesController.createLeague);
router.put("/leagues/:id", leaguesController.updateLeague);
router.delete("/leagues/:id", leaguesController.deleteLeague);

// ===== SHIRTS ROUTES =====
router.get("/shirts", shirtsController.getAllShirts);
router.get("/shirts/:id", shirtsController.getShirtById);
router.post("/shirts", shirtsController.createShirt);
router.put("/shirts/:id", shirtsController.updateShirt);
router.delete("/shirts/:id", shirtsController.deleteShirt);

// // ===== VIDEO ROUTES =====
router.get("/video", videoController.getAllVideos);
router.get("/video/:id", videoController.getVideoById);
router.post("/video", videoController.createVideo);
router.put("/video/:id", videoController.updateVideo);
router.delete("/video/:id", videoController.deleteVideo);

// ===== SHIRT GAMES ROUTES =====
router.get("/shirt-games", shirtGameController.getShirtGames);
router.post("/shirt-games", shirtGameController.createShirtGame);
router.put("/shirt-games/:id", shirtGameController.updateShirtGame);
router.delete("/shirt-games/:id", shirtGameController.deleteShirtGame);

// ===== USERS ROUTES =====
router.get("/users", usersController.getAllUsers);
router.get("/users/:id", usersController.getUserById);
router.put("/users/:id/role", usersController.updateUserRole);
router.delete("/users/:id", usersController.deleteUser);

// ===== CAREER GAMES ROUTES =====
router.get("/career-games", gamesController.getAllCareerGames);
router.get("/career-games/:id", gamesController.getCareerGameById);
router.post("/career-games", gamesController.createCareerGame);
router.put("/career-games/:id", gamesController.updateCareerGame);
router.delete("/career-games/:id", gamesController.deleteCareerGame);

// ===== PLAYER GAMES ROUTES =====
router.get("/player-games", gamesController.getAllPlayerGames);
router.get("/player-games/:id", gamesController.getPlayerGameById);
router.post("/player-games", gamesController.createPlayerGame);
router.put("/player-games/:id", gamesController.updatePlayerGame);
router.delete("/player-games/:id", gamesController.deletePlayerGame);

// // ===== VIDEO GAMES ROUTES =====
router.get("/video-games", videoGameController.getVideoGames);
router.get("/video-games/:id", videoGameController.getVideoGameById);
router.post("/video-games", videoGameController.createVideoGame);
router.patch("/video-games/:id", videoGameController.updateVideoGameClip);
router.delete("/video-games/:id", videoGameController.deleteVideoGame);

// ===== COUNTRIES ROUTES =====
router.get("/countries", countriesController.getAllCountries);

export default router;
