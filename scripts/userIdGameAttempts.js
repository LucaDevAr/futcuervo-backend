import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import GameAttempt from "../src/models/GameAttempt.js";

dotenv.config();

// Conectar a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB conectado para migración");
  } catch (error) {
    console.error("❌ Error al conectar con MongoDB:", error);
    process.exit(1);
  }
};

const KEEP_USER_ID = "683e0873164171f48b90f3b2";

// 📌 Borrar todos los GameAttempt que no sean del usuario dado
const deleteOtherAttempts = async () => {
  try {
    const result = await GameAttempt.deleteMany({
      userId: { $ne: KEEP_USER_ID },
    });
    console.log(
      `✅ Eliminados ${result.deletedCount} documentos de otros usuarios`
    );
  } catch (error) {
    console.error("❌ Error eliminando documentos:", error);
  } finally {
    mongoose.connection.close();
  }
};

// 🚀 Ejecutar
(async () => {
  await connectDB();
  await deleteOtherAttempts();
})();
