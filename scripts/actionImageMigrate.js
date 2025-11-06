/**
 * actionImageMigrate.js
 * - Copia actionImage global a clubsStats del club San Lorenzo
 * - Pone actionImage global en null
 * - No toca career ni rompe validaciones
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Player from "../src/models/Player.js";

dotenv.config();
mongoose.set("strictQuery", false);

const SAN_LORENZO_ID = "68429af7587b60bfbe49342b";
// TEST_ONLY_PLAYER_ID = '68431e8f847baf55c82c2616'; // probar 1 jugador
const TEST_ONLY_PLAYER_ID = null;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB conectado para migración de actionImage");
  } catch (err) {
    console.error("❌ Error al conectar con MongoDB:", err);
    process.exit(1);
  }
};

const migrateActionImages = async () => {
  try {
    const query = TEST_ONLY_PLAYER_ID
      ? { _id: new mongoose.Types.ObjectId(TEST_ONLY_PLAYER_ID) }
      : {};

    const players = await Player.find(query);
    console.log(`⚽ Jugadores encontrados para migrar: ${players.length}`);

    for (const player of players) {
      console.log(`\n🔄 Procesando: ${player.fullName} (${player._id})`);

      if (!player.actionImage) {
        console.log("  → No hay actionImage global, se saltea");
        continue;
      }

      // Buscar San Lorenzo en clubsStats
      let sanLStatsIndex = player.clubsStats.findIndex(
        (c) => String(c.club) === SAN_LORENZO_ID
      );

      if (sanLStatsIndex === -1) {
        console.log(
          "  → No se encontró San Lorenzo en clubsStats, creando uno nuevo"
        );
        player.clubsStats.push({
          club: new mongoose.Types.ObjectId(SAN_LORENZO_ID),
          clubName: "San Lorenzo",
          goals: 0,
          appearances: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          actionImage: player.actionImage,
        });
      } else {
        console.log(
          `  → Copiado actionImage a clubsStats de San Lorenzo: ${player.actionImage}`
        );
        player.clubsStats[sanLStatsIndex].actionImage = player.actionImage;
      }

      // Poner actionImage global en null
      player.actionImage = null;

      // Guardar
      await player.save();
      console.log("  → Guardado con éxito");
    }

    console.log("\n✅ Migración finalizada.");
  } catch (err) {
    console.error("❌ Error durante migración:", err);
  } finally {
    await mongoose.disconnect();
  }
};

(async () => {
  await connectDB();
  await migrateActionImages();
})();
