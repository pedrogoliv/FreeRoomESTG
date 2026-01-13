const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    curso: { type: String, required: true, trim: true },
    numero: { type: String, required: false, unique: true, sparse: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }, 
    favoritos: { type: [String], default: [] },
    tipo: { type: String, default: "aluno" },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return; 
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);