import mongoose from "mongoose";

const shirtGameSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    shirt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shirt",
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

// 🔹 Quitar cualquier índice viejo que sólo use `date`
shirtGameSchema.index({ date: 1 }, { unique: false });

// 🔹 Nuevo índice compuesto único (fecha + club)
shirtGameSchema.index({ date: 1, clubId: 1 }, { unique: true, sparse: true });

const ShirtGame =
  mongoose.models.ShirtGame || mongoose.model("ShirtGame", shirtGameSchema);

export default ShirtGame;
