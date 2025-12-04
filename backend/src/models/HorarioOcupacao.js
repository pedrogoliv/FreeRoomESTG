const mongoose = require("mongoose");

const HorarioOcupacaoSchema = new mongoose.Schema({
  salaId: { type: mongoose.Schema.Types.ObjectId, ref: "Sala", required: true },
  data: { type: String, required: true },
  horaInicio: { type: String, required: true },
  horaFim: { type: String, required: true },
  origem: { type: String, enum: ["scraping", "reserva"], default: "scraping" }
}, { timestamps: true });

module.exports = mongoose.model("HorarioOcupacao", HorarioOcupacaoSchema);
