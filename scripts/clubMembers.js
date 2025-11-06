import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";
import Club from "../src/models/Club.js";
import ClubMember from "../src/models/ClubMember.js";

dotenv.config();

// 🔵 ID de San Lorenzo
const SAN_LORENZO_ID = "68429af7587b60bfbe49342b";

// 📌 Conexión a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB conectado para migración");
  } catch (error) {
    console.error("❌ Error al conectar con MongoDB:", error);
    process.exit(1);
  }
};

// 📌 Migración: agregar todos los users a San Lorenzo
const migrateUsersToSanLorenzo = async () => {
  try {
    // 1️⃣ Asegurarse de que el club tenga members y points
    const club = await Club.findById(SAN_LORENZO_ID);
    if (!club) throw new Error("Club San Lorenzo no encontrado");

    if (club.members === undefined) club.members = 0;
    if (club.points === undefined) club.points = 0;
    await club.save();

    // 2️⃣ Obtener todos los usuarios
    const users = await User.find({});
    console.log(`👥 Usuarios encontrados: ${users.length}`);

    // 3️⃣ Crear ClubMember para cada usuario
    let addedCount = 0;
    for (const user of users) {
      // Crear points en user si no existe
      if (user.points === undefined) {
        user.points = 0;
        await user.save();
      }

      // Verificar si ya es miembro
      const exists = await ClubMember.findOne({
        userId: user._id,
        clubId: SAN_LORENZO_ID,
      });

      if (!exists) {
        await ClubMember.create({
          userId: user._id,
          clubId: SAN_LORENZO_ID,
          role: "partner",
          points: 0,
        });
        addedCount++;
      }
    }

    // 4️⃣ Actualizar cantidad de miembros del club
    club.members = await ClubMember.countDocuments({ clubId: SAN_LORENZO_ID });
    await club.save();

    console.log(
      `✅ Migración completada: ${addedCount} usuarios agregados a San Lorenzo`
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
  await migrateUsersToSanLorenzo();
})();
