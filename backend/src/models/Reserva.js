const mongoose = require('mongoose');

const ReservaSchema = new mongoose.Schema({
    sala: String,
    dia: String,
    hora_inicio: String,
    hora_fim: String,
    responsavel: String,
    motivo: String
}, {
    timestamps: true // Adiciona automaticamente data de criação
});

module.exports = mongoose.model('Reserva', ReservaSchema, 'reservas');