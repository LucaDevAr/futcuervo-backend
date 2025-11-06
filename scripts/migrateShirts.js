import mongoose from "mongoose";
import dotenv from "dotenv";
import ShirtGame from "../src/models/ShirtGame.js"; // ajustá la ruta si es diferente

dotenv.config();

// 🔵 ID del club (San Lorenzo, por ejemplo)
const SAN_LORENZO_ID = "68429af7587b60bfbe49342b";

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

// 📌 Migración: actualizar todos los ShirtGames que no tengan clubId
const migrateShirtGames = async () => {
  try {
    const result = await ShirtGame.updateMany(
      { clubId: { $exists: false } }, // solo los que no tienen clubId
      { $set: { clubId: SAN_LORENZO_ID } }
    );

    console.log(
      `✅ Migración completada: ${result.modifiedCount} ShirtGames actualizados`
    );
  } catch (error) {
    console.error("❌ Error en la migración:", error);
  } finally {
    mongoose.connection.close();
  }
};

// 🚀 Ejecutar
(async () => {
  await connectDB();
  await migrateShirtGames();
})();
