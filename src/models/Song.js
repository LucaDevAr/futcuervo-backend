import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const SongSchema = new Schema({
  title: { type: String, required: true },
  lyrics: { type: String },
  audioUrl: { type: String, required: true },
  audioPublicId: { type: String },
  coverUrl: { type: String },
  coverPublicId: { type: String },
  tags: [{ type: String }],
  duration: { type: Number },
  createdAt: { type: Date, default: Date.now },
  originalSong: {
    type: {
      title: String,
      url: String,
      author: String,
      year: Number,
    },
    required: false,
  },
});

const Song = models.Song || model("Song", SongSchema);
export default Song;
