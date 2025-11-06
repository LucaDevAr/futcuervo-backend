import mongoose from "mongoose";

const { Schema, model, models, Types } = mongoose;

const PlayerSchema = new Schema(
  {
    fullName: { type: String, required: true },
    displayName: { type: String },
    nicknames: [{ type: String }],
    birthdate: { type: Date },
    debutDate: { type: Date },
    retirementDate: { type: Date },

    nationality: {
      name: { type: String, required: true },
      flagImage: { type: String },
    },

    positions: [
      {
        type: String,
        enum: [
          "PO",
          "CT",
          "LD",
          "LI",
          "MCD",
          "MC",
          "MD",
          "MI",
          "MO",
          "ED",
          "EI",
          "SD",
          "DC",
        ],
      },
    ],

    profileImage: { type: String }, // imagen de perfil general
    // actionImage global se elimina o se mantiene solo como fallback
    actionImage: { type: String },

    // 🏆 Títulos del jugador
    titles: [
      {
        name: { type: String, required: true },
        image: { type: String },
        year: { type: Number },
      },
    ],

    // ⚽ Career global, cada etapa del jugador
    career: [
      {
        club: { type: Types.ObjectId, ref: "Club" },
        name: { type: String },
        from: { type: Date },
        to: { type: Date },
      },
    ],

    // 📊 Stats por club (ahora incluye actionImage por club)
    clubsStats: [
      {
        club: { type: Types.ObjectId, ref: "Club" },
        clubName: { type: String },
        goals: { type: Number, default: 0 },
        appearances: { type: Number, default: 0 },
        assists: { type: Number, default: 0 },
        yellowCards: { type: Number, default: 0 },
        redCards: { type: Number, default: 0 },
        actionImage: { type: String }, // nueva propiedad por club
      },
    ],

    // 🏆 Totales globales
    totalGoals: { type: Number, default: 0 },
    totalAppearances: { type: Number, default: 0 },
    totalAssists: { type: Number, default: 0 },
    totalYellowCards: { type: Number, default: 0 },
    totalRedCards: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Player = models.Player || model("Player", PlayerSchema);
export default Player;
