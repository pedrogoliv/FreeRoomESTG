const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }, // hashed 

    curso: { type: String, required: true, trim: true },
    numero: { type: String, required: false, unique: true, sparse: true, trim: true },

    tipo: { type: String, default: "aluno" },
    favoritos: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
