const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed
  curso: { type: String, required: true },
  numero: { type: String, required: true, unique: true, trim: true },
  tipo: { type: String, default: "aluno" }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
