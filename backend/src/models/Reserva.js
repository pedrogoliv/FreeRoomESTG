const mongoose = require("mongoose");

const ReservaSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  salaId: { type: mongoose.Schema.Types.ObjectId, ref: "Sala", required: true },
  
  data: { type: String, required: true },          // "2025-01-15"
  horaInicio: { type: String, required: true },    // "14:00"
  horaFim: { type: String, required: true },       // "15:00"
}, { timestamps: true });

module.exports = mongoose.model("Reserva", ReservaSchema);
