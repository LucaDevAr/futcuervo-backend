import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../src/models/User.js";

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

// Función para migrar documentos
const migrateGameAttempts = async () => {
  try {
    console.log("🔄 Iniciando migración de GameAttempts...");

    // Obtener la colección directamente para poder hacer operaciones más flexibles
    const db = mongoose.connection.db;
    const collection = db.collection("gameattempts");

    // Buscar todos los documentos que necesitan migración
    const oldDocuments = await collection
      .find({
        userId: "futcuervo@gmail.com", // El email que vimos en tu documento
      })
      .toArray();

    console.log(`📊 Encontrados ${oldDocuments.length} documentos para migrar`);

    if (oldDocuments.length === 0) {
      console.log("ℹ️ No hay documentos para migrar");
      return;
    }

    // Buscar el usuario por email para obtener su ObjectId
    const user = await User.findOne({ email: "futcuervo@gmail.com" });
    if (!user) {
      console.error("❌ Usuario no encontrado con email: futcuervo@gmail.com");
      return;
    }

    console.log(`👤 Usuario encontrado: ${user._id} (${user.name})`);

    // Migrar cada documento
    let migratedCount = 0;
    for (const doc of oldDocuments) {
      try {
        console.log(`🔄 Migrando documento ${doc._id} (${doc.gameType})`);

        // Preparar el documento actualizado
        const updatedDoc = {
          userId: user._id.toString(), // Convertir email a ObjectId string
          gameType: doc.gameType,
          date: doc.date,
          won: doc.won,
          score: doc.score,
          streak: doc.streak || 0,
          recordScore: doc.recordScore || doc.score, // Si no tiene recordScore, usar score
          gameData: doc.gameData || {},
          timeUsed: doc.timeUsed || 0,
          livesRemaining: doc.livesRemaining || 0,
          gameMode: "daily", // Valor por defecto
          createdAt: doc.createdAt,
          updatedAt: new Date(), // Actualizar timestamp
          __v: doc.__v || 0,
        };

        // Actualizar el documento
        await collection.replaceOne({ _id: doc._id }, updatedDoc);

        console.log(`✅ Documento ${doc._id} migrado exitosamente`);
        migratedCount++;
      } catch (error) {
        console.error(`❌ Error migrando documento ${doc._id}:`, error);
      }
    }

    console.log(
      `🎉 Migración completada: ${migratedCount}/${oldDocuments.length} documentos migrados`
    );
  } catch (error) {
    console.error("❌ Error durante la migración:", error);
  }
};

// Función principal
const main = async () => {
  await connectDB();
  await migrateGameAttempts();
  await mongoose.disconnect();
  console.log("🔌 Desconectado de MongoDB");
  process.exit(0);
};

// Ejecutar migración
main().catch((error) => {
  console.error("❌ Error en migración:", error);
  process.exit(1);
});
