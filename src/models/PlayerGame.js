import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const PlayerGameSchema = new Schema(
  {
    date: { type: Date, required: true, unique: true },
    player: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      required: true,
      unique: true,
    },
    selectedName: { type: String, required: true },
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      default: null,
    },
  },
  { timestamps: true }
);

// 🔹 Nuevo índice compuesto único (fecha + club)
PlayerGameSchema.index({ date: 1, clubId: 1 }, { unique: true, sparse: true });

const PlayerGame =
  mongoose.models.PlayerGame || mongoose.model("PlayerGame", PlayerGameSchema);

export default PlayerGame;
