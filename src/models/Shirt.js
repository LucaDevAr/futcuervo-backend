import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const ShirtSchema = new Schema(
  {
    clubId: {
      type: Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "Titular",
        "Suplente",
        "Alternativa",
        "Cuarta",
        "Arquero",
        "Arquero 2",
        "Arquero 3",
        "Entrenamiento",
        "Especial",
      ],
      required: true,
    },
    images: {
      base: String,
      withoutEmblem: String,
      noSponsors: String,
      withSponsors: [String],
    },
    sponsors: [String],
    brand: String,
    seasonsUsed: [String],
    emblemType: {
      type: String,
      enum: ["escudo", "emblema", null], // 👈 ahora puede ser null
      default: null, // 👈 valor por defecto: sin escudo
    },
  },
  { timestamps: true }
);

const Shirt = models.Shirt || model("Shirt", ShirtSchema);
export default Shirt;
