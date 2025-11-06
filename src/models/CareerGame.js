import mongoose from "mongoose";

const careerGameSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// 🔹 Nuevo índice compuesto único (fecha + club)
careerGameSchema.index({ date: 1, clubId: 1 }, { unique: true, sparse: true });

const CareerGame =
  mongoose.models.CareerGame || mongoose.model("CareerGame", careerGameSchema);

export default CareerGame;
