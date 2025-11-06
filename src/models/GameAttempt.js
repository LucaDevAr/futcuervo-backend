import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const GameAttemptSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    gameType: {
      type: String,
      required: true,
    },
    clubId: { type: Schema.Types.ObjectId, ref: "Club" },
    date: { type: Date, required: true },
    won: { type: Boolean, required: true },
    score: { type: Number, required: true },
    streak: { type: Number, default: 0 },
    recordScore: { type: Number },
    gameData: { type: Object, default: {} },
    timeUsed: { type: Number },
    livesRemaining: { type: Number },
    gameMode: { type: String, required: true },
  },
  { timestamps: true }
);

GameAttemptSchema.index(
  { userId: 1, gameType: 1, clubId: 1 },
  { unique: true }
);
GameAttemptSchema.index({ userId: 1, gameType: 1, createdAt: -1 });

const GameAttempt =
  models.GameAttempt || model("GameAttempt", GameAttemptSchema);
export default GameAttempt;
