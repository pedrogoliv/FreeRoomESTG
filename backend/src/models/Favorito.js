const mongoose = require("mongoose");

const FavoritoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  salaId: { type: mongoose.Schema.Types.ObjectId, ref: "Sala", required: true },
  dataRegisto: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Favorito", FavoritoSchema);
