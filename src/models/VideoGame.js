import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const VideoGameSchema = new Schema(
  {
    date: { type: Date, required: true },
    video: { type: Schema.Types.ObjectId, ref: "Video", required: true },
    clipStart: { type: Number, default: 0 },
    clipEnd: { type: Number, default: 10 },
    answerStart: { type: Number, required: true },
    answerEnd: { type: Number, required: true },
    options: {
      type: [
        {
          text: { type: String, required: true },
          isCorrect: { type: Boolean, required: true },
        },
      ],
      required: true,
      default: [],
    },
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      default: null,
    },
  },
  { timestamps: true }
);

// 🔹 Nuevo índice compuesto único (fecha + club)
VideoGameSchema.index({ date: 1, clubId: 1 }, { unique: true, sparse: true });

const VideoGame =
  mongoose.models.VideoGame || mongoose.model("VideoGame", VideoGameSchema);

export default VideoGame;
