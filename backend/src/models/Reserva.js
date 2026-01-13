const mongoose = require("mongoose");

const ReservaSchema = new mongoose.Schema(
  {
    sala: { type: String, required: true, trim: true },
    dia: { type: String, required: true },
    hora_inicio: { type: String, required: true },
    hora_fim: { type: String, required: true },
    responsavel: { type: String, required: true, trim: true },
    motivo: { type: String, default: "", trim: true },
    pessoas: { type: Number, required: true, min: 1, default: 1 },

    status: {
      type: String,
      enum: ["ativa", "cancelada"],
      default: "ativa",
    },
    canceledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reserva", ReservaSchema, "reservas");
