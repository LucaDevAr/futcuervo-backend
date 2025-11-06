import mongoose from "mongoose";

const { Schema, models, model } = mongoose;

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, minlength: 6, select: false },
    image: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    emailVerified: Date,
    provider: String,

    // Puntos globales del usuario (todos los juegos)
    points: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const User = models.User || model("User", UserSchema);
export default User;
