import mongoose from "mongoose";

const { Schema, model, models, Types } = mongoose;

const CoachSchema = new Schema(
  {
    fullName: { type: String, required: true },
    displayName: { type: String },
    nicknames: [{ type: String }],
    birthdate: { type: Date },
    nationality: {
      name: { type: String, required: true },
      flagImage: { type: String },
    },
    careerPath: [
      {
        club: { type: Types.ObjectId, ref: "Club", required: true },
        joinedDate: { type: Number, required: true },
        leftDate: { type: Number },
      },
    ],
    titles: [
      {
        name: { type: String, required: true },
        image: { type: String },
        year: { type: Number },
      },
    ],
    appearances: { type: Number, default: 0 },
    profileImage: { type: String },
    actionImage: { type: String },
  },
  { timestamps: true }
);

const Coach = models.Coach || model("Coach", CoachSchema);
export default Coach;
