import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const ClubMemberSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clubId: { type: Schema.Types.ObjectId, ref: "Club", required: true },

    role: { type: String, enum: ["partner", "supporter"], required: true },

    // Puntos que este user sumó a este club
    points: { type: Number, default: 0 },

    joinedDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ClubMemberSchema.index({ userId: 1, clubId: 1, role: 1 }, { unique: true });

const ClubMember = models.ClubMember || model("ClubMember", ClubMemberSchema);
export default ClubMember;
