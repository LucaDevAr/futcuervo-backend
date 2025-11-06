import mongoose from "mongoose";
import dotenv from "dotenv";
import GameAttempt from "../src/models/GameAttempt.js"; // ajustá la ruta a tu modelo

dotenv.config();

// 🔵 ID de San Lorenzo (asegurate que exista en tu colección Club)
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

// 📌 Migración: actualizar todos los GameAttempts que no tengan clubId
const migrateAttempts = async () => {
  try {
    const result = await GameAttempt.updateMany(
      { clubId: { $exists: false } }, // solo los que no tienen clubId
      { $set: { clubId: SAN_LORENZO_ID } }
    );

    console.log(
      `✅ Migración completada: ${result.modifiedCount} documentos actualizados`
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
  await migrateAttempts();
})();
