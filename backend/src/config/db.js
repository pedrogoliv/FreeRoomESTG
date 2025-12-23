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