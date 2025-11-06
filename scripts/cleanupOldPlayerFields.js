import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB conectado para limpieza de Players");
  } catch (error) {
    console.error("❌ Error al conectar con MongoDB:", error);
    process.exit(1);
  }
};

const cleanupPlayers = async () => {
  try {
    const db = mongoose.connection.db;
    const players = db.collection("players");

    const unsetFields = {
      goals: "",
      appearances: "",
      redCards: "",
      jerseysUsed: "",
      careerPath: "",
    };

    const result = await players.updateMany({}, { $unset: unsetFields });

    console.log(
      `✅ Limpieza completada: ${result.modifiedCount} jugadores actualizados`
    );
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
  } finally {
    await mongoose.disconnect();
  }
};

(async () => {
  await connectDB();
  await cleanupPlayers();
})();
