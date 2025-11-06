import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const SongGameSchema = new Schema(
  {
    date: { type: Date, required: true, unique: true },
    song: {
      type: Schema.Types.ObjectId,
      ref: "Song",
      required: true,
      unique: true,
    },
    clipStart: { type: Number, default: 0 },
    clipEnd: { type: Number, default: 5 },
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      default: null,
    },
  },
  { timestamps: true }
);

// 🔹 Nuevo índice compuesto único (fecha + club)
SongGameSchema.index({ date: 1, clubId: 1 }, { unique: true, sparse: true });

const SongGame =
  mongoose.models.SongGame || mongoose.model("SongGame", SongGameSchema);

export default SongGame;
