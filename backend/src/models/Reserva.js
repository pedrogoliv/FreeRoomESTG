const mongoose = require('mongoose');

const ReservaSchema = new mongoose.Schema({
    sala: String,
    dia: String,
    hora_inicio: String,
    hora_fim: String,
    responsavel: String,
    motivo: String,
    pessoas: { type: Number, required: true, min: 1, default: 1 },
}, {
    timestamps: true // Adiciona automaticamente data de criação
});

module.exports = mongoose.model('Reserva', ReservaSchema, 'reservas');