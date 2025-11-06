import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const VideoSchema = new Schema({
  title: { type: String, required: true },
  videoUrl: { type: String, required: true },
  videoId: { type: String, required: true },
  thumbnailUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Extract YouTube ID before saving
VideoSchema.pre("save", function (next) {
  if (this.videoUrl) {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = this.videoUrl.match(regExp);
    if (match && match[2].length === 11) {
      this.videoId = match[2];
    }
  }
  next();
});

const Video = models.Video || model("Video", VideoSchema);
export default Video;
