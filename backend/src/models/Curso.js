const mongoose = require("mongoose");

const CursoSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true, trim: true },
});

module.exports = mongoose.models.Curso || mongoose.model("Curso", CursoSchema);
