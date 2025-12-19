// config/db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      return; // Ya conectado
    }

    await mongoose.connect(process.env.MONGODB_URI);

    // console.log("✅ MongoDB conectado");
  } catch (error) {
    console.error("❌ Error al conectar con MongoDB:", error);
    process.exit(1);
  }
};

export default connectDB;
