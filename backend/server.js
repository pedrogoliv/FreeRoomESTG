const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./src/config/db");

const Ocupacao = require("./src/models/OcupacaoRaw");
const Reserva = require("./src/models/Reserva");

connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rota de Teste
app.get("/", (req, res) => {
  res.send("FreeRoomESTG API running...");
});

// ROTA 1: Ler ocupações (GET)
app.get("/api/todas-ocupacoes", async (req, res) => {
  try {
    const aulas = await Ocupacao.find().sort({ dia: 1, hora_inicio: 1 }).limit(50);
    res.json(aulas);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao buscar aulas: " + err.message);
  }
});

// ROTA 2: Listar reservas (GET) - útil para frontend/debug
app.get("/api/reservas", async (req, res) => {
  try {
    const reservas = await Reserva.find().sort({ createdAt: -1 }).limit(50);
    res.json(reservas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: err.message });
  }
});

// ROTA 3: Criar uma reserva (POST) com verificação de conflito
app.post("/api/reservar", async (req, res) => {
  try {
    const { sala, dia, hora_inicio, hora_fim } = req.body;

    if (!sala || !dia || !hora_inicio || !hora_fim) {
      return res.status(400).json({ erro: "Faltam campos obrigatórios." });
    }

    // Função: "HH:MM" ou "HH:MM:SS" -> minutos
    const toMinutes = (t) => {
      const parts = t.split(":").map(Number);
      const h = parts[0] ?? 0;
      const m = parts[1] ?? 0;
      return h * 60 + m;
    };

    const novoIni = toMinutes(hora_inicio);
    const novoFim = toMinutes(hora_fim);

    if (novoFim <= novoIni) {
      return res.status(400).json({ erro: "hora_fim tem de ser maior que hora_inicio." });
    }

    // Buscar aulas e reservas existentes para a mesma sala/dia
    const aulas = await Ocupacao.find({ sala, dia });
    const reservas = await Reserva.find({ sala, dia });

    const ocupacoes = [
      ...aulas.map((a) => ({ tipo: "AULA", inicio: a.hora_inicio, fim: a.hora_fim })),
      ...reservas.map((r) => ({ tipo: "RESERVA", inicio: r.hora_inicio, fim: r.hora_fim })),
    ];

    const conflito = ocupacoes.some((o) => {
      const ini = toMinutes(o.inicio);
      const fim = toMinutes(o.fim);
      return novoIni < fim && novoFim > ini; // overlap
    });

    if (conflito) {
      return res.status(409).json({ erro: "Sala já está ocupada nesse horário." });
    }

    const novaReserva = await Reserva.create(req.body);
    return res.status(201).json({ mensagem: "Reserva criada!", dados: novaReserva });
  } catch (err) {
    console.error("❌ Erro ao criar reserva:", err);
    return res.status(500).json({ erro: "Erro no servidor: " + err.message });
  }
});

// Rota 4: AULAS + RESERVAS por sala/dia
app.get("/api/sala/:nomeSala/ocupacao", async (req, res) => {
  try {
    const { nomeSala } = req.params;
    const { dia } = req.query;

    if (!dia) {
      return res.status(400).json({ erro: "Falta o query param ?dia=YYYY-MM-DD" });
    }

    const aulas = await Ocupacao.find({ sala: nomeSala, dia });
    const reservas = await Reserva.find({ sala: nomeSala, dia });

    const listaOcupada = [
      ...aulas.map((a) => ({
        tipo: "AULA",
        inicio: a.hora_inicio,
        fim: a.hora_fim,
        titulo: a.curso || "Aula",
      })),
      ...reservas.map((r) => ({
        tipo: "RESERVA",
        inicio: r.hora_inicio,
        fim: r.hora_fim,
        titulo: "Reservado: " + (r.motivo || ""),
      })),
    ];

    res.json(listaOcupada);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
