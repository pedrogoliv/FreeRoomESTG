const mongoose = require("mongoose");

const OcupacaoRawSchema = new mongoose.Schema(
  {
    sala: { type: String, required: true },
    curso: { type: String },
    dia: { type: String, required: true },          
    hora_inicio: { type: String, required: true },  
    hora_fim: { type: String, required: true },     
    semana: { type: Number },
  },
  {
    collection: "ocupacoes",
    timestamps: false,
  }
);

module.exports = mongoose.model("OcupacaoRaw", OcupacaoRawSchema);
