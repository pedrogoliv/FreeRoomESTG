// src/models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    curso: { type: String, required: true, trim: true },
    numero: { type: String, required: false, unique: true, sparse: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }, // em produção: bcrypt
    favoritos: { type: [String], default: [] },
    tipo: { type: String, default: "aluno" },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);