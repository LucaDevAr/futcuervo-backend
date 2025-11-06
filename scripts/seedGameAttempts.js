// scripts/seedGameAttempts.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import GameAttempt from "../src/models/GameAttempt.js"; // ajustá la ruta a tu modelo

dotenv.config();

// 🔵 IDs de usuario y club
const USER_ID = "683e0873164171f48b90f3b2";
const CLUB_ID = "68429af7587b60bfbe49342b";

// 📌 Conectarse a la base de datos
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB conectado para migración");
  } catch (error) {
    console.error("❌ Error al conectar con MongoDB:", error);
    process.exit(1);
  }
};

// 📌 Crear 10 GameAttempts
const seedGameAttempts = async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);

    const gameTypes = [
      "player",
      "shirt",
      "song",
      "career",
      "video",
      "history",
      "national",
      "league",
      "goals",
      "appearances",
    ];

    const attempts = gameTypes.map((type, index) => ({
      userId: USER_ID,
      clubId: CLUB_ID,
      gameType: type,
      date: yesterday,
      won: index % 2 === 0,
      score: 10 + index * 5, // stats diferentes
      streak: index,
      recordScore: 20 + index * 5,
      gameData: { info: `Datos de prueba para ${type}` },
      timeUsed: 30 + index * 10,
      livesRemaining: 3 - (index % 3),
      gameMode: "daily",
    }));

    const result = await GameAttempt.insertMany(attempts);
    console.log(`✅ ${result.length} GameAttempts creados correctamente`);
  } catch (error) {
    console.error("❌ Error creando GameAttempts:", error);
  } finally {
    mongoose.connection.close();
  }
};

// 🚀 Ejecutar
(async () => {
  await connectDB();
  await seedGameAttempts();
})();
