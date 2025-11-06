import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const GameConfigSchema = new Schema(
  {
    gameSlug: {
      type: String,
      required: true,
      unique: true,
      enum: [
        "history",
        "shirt",
        "song",
        "national-team",
        "league-team",
        "career",
        "player",
        "video",
        "goals",
        "appearances",
      ],
    },
    enabled: { type: Boolean, default: true },
    modes: {
      time: {
        enabled: { type: Boolean, default: true },
        timeLimit: { type: Number, default: 60 },
        lives: { type: Number },
        rules: [{ type: String }],
      },
      lives: {
        enabled: { type: Boolean, default: true },
        timeLimit: { type: Number },
        lives: { type: Number, default: 3 },
        rules: [{ type: String }],
      },
      normal: {
        enabled: { type: Boolean, default: true },
        timeLimit: { type: Number },
        lives: { type: Number },
        rules: [{ type: String }],
      },
    },
    title: { type: String, required: true },
    objective: { type: String, required: true },
    mediaTypes: [
      { type: String, enum: ["image", "video", "audio", "youtube"] },
    ],
    questionBased: { type: Boolean, default: false },
    stepBased: { type: Boolean, default: false },
    updatedBy: { type: String },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const GameConfig = models.GameConfig || model("GameConfig", GameConfigSchema);
export default GameConfig;
