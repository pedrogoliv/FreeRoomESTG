<<<<<<< HEAD
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
=======
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Tenta ligar usando o link que está no ficheiro .env
        const conn = await mongoose.connect(process.env.MONGO_URI);
        
        console.log(`✅ MongoDB Ligado com sucesso: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Erro ao ligar à BD: ${error.message}`);
        process.exit(1); // Fecha o servidor se não conseguir ligar
    }
};

module.exports = connectDB;
>>>>>>> 4b1f4a3f2f1a7f0a73731c0f98370933dd565685
