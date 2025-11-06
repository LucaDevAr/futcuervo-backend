import mongoose from "mongoose";
import dotenv from "dotenv";
import ShirtGame from "../src/models/ShirtGame.js"; // ajustá la ruta según tu estructura

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado a MongoDB");

    // 🔹 Eliminar todos los índices actuales
    const result = await ShirtGame.collection.dropIndexes();
    console.log("🧹 Índices antiguos eliminados:", result);

    // 🔹 Volver a crear los índices definidos en el schema
    await ShirtGame.syncIndexes();
    console.log("✅ Nuevos índices sincronizados con el schema");
  } catch (err) {
    if (err.codeName === "IndexNotFound") {
      console.log("⚠️ No había índices para eliminar, creando nuevos...");
      await ShirtGame.syncIndexes();
      console.log("✅ Nuevos índices creados");
    } else {
      console.error("❌ Error al reiniciar índices:", err);
    }
  } finally {
    mongoose.connection.close();
  }
};

run();
