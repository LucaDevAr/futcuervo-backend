import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const ClubSchema = new Schema(
  {
    name: { type: String, required: true },
    logo: String,
    league: { type: Schema.Types.ObjectId, ref: "League", required: true },

    // Puntos globales del club
    points: { type: Number, default: 0 },

    // Para cachear cantidad de miembros (opcional)
    members: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Club = models.Club || model("Club", ClubSchema);
export default Club;
