import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const ClubSchema = new Schema(
  {
    name: { type: String, required: true },
    logo: String,
    league: { type: Schema.Types.ObjectId, ref: "League", required: true },

    transfermarktId: {
      type: String,
      sparse: true,
    },

    points: { type: Number, default: 0 },
    members: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 🔒 ÍNDICE REAL Y SEGURO
ClubSchema.index({ transfermarktId: 1 }, { unique: true, sparse: true });

const Club = models.Club || model("Club", ClubSchema);
export default Club;
