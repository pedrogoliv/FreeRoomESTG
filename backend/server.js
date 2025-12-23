const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./src/config/db");

// --- IMPORTAÇÕES (O erro estava provavlemente aqui!) ---
const Ocupacao = require("./src/models/OcupacaoRaw"); // Nota: Usa o OcupacaoRaw que já tinhas
const Reserva = require("./src/models/Reserva");      // <--- ESTA LINHA É CRITICA

// Ligar à Base de Dados
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Permite ler JSON que vem do teste

// Rota de Teste Simples
app.get("/", (req, res) => {
  res.send("FreeRoomESTG API running...");
});

// ---------------------------------------------------------
// ROTA 1: Ler todas as aulas (GET)
// ---------------------------------------------------------
app.get("/api/todas-ocupacoes", async (req, res) => {
  try {
    const aulas = await Ocupacao.find().limit(20);
    res.json(aulas);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao buscar aulas: " + err.message);
  }
});

// ---------------------------------------------------------
// ROTA 2: Criar uma reserva (POST)
// ---------------------------------------------------------
app.post("/api/reservar", async (req, res) => {
    try {
        console.log("📥 Recebi um pedido de reserva:", req.body); // Log para vermos no terminal

        const novaReserva = new Reserva(req.body);
        await novaReserva.save();

        console.log("💾 Reserva guardada com sucesso!");
        res.status(201).json({ mensagem: "Reserva criada!", dados: novaReserva });
    } catch (erro) {
        console.error("❌ Erro ao criar reserva:", erro);
        res.status(500).json({ erro: "Erro no servidor: " + erro.message });
    }
});

// Rota inteligente que verifica TUDO (Aulas + Reservas)
app.get("/api/sala/:nomeSala/ocupacao", async (req, res) => {
    try {
        const { nomeSala } = req.params;
        const { dia } = req.query; // Ex: ?dia=2025-01-01

        // 1. Ir buscar as Aulas normais
        const aulas = await Ocupacao.find({ sala: nomeSala, dia: dia });

        // 2. Ir buscar as Reservas dos alunos
        const reservas = await Reserva.find({ sala: nomeSala, dia: dia });

        // 3. Misturar tudo numa lista única padronizada
        const listaOcupada = [
            ...aulas.map(a => ({
                tipo: "AULA",
                inicio: a.hora_inicio,
                fim: a.hora_fim,
                titulo: a.curso // Ou cadeira
            })),
            ...reservas.map(r => ({
                tipo: "RESERVA",
                inicio: r.hora_inicio,
                fim: r.hora_fim,
                titulo: "Reservado: " + r.motivo
            }))
        ];

        res.json(listaOcupada);

    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// Iniciar Servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port " + PORT));