import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

// Subschema para media
const MediaSchema = new Schema({
  type: { type: String, enum: ["image", "video"], required: true },
  url: { type: String, required: true },
});

// Subschema para preguntas
const QuestionSchema = new Schema({
  question: { type: String, required: true },
  media: { type: [MediaSchema], default: [] },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (v) => v.length === 4,
      message: "Debe tener exactamente 4 opciones",
    },
  },
  correctAnswer: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return this.options.includes(v);
      },
      message: "La respuesta correcta debe estar entre las opciones",
    },
  },
});

const HistoryGameSchema = new Schema(
  {
    date: { type: Date, required: true, unique: true },
    topic: { type: String, required: true },
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      default: null,
    },
    questions: {
      type: [QuestionSchema],
      required: true,
      validate: {
        validator: (v) => v.length >= 1,
        message: "Debe tener al menos una pregunta",
      },
    },
  },
  { timestamps: true }
);

// 🔹 Nuevo índice compuesto único (fecha + club)
HistoryGameSchema.index({ date: 1, clubId: 1 }, { unique: true, sparse: true });

const HistoryGame =
  mongoose.models.HistoryGame ||
  mongoose.model("HistoryGame", HistoryGameSchema);

export default HistoryGame;
