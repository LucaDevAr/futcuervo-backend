import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const LeagueSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    logoUrl: String,
  },
  { timestamps: true }
);

const League = models.League || model("League", LeagueSchema);
export default League;
