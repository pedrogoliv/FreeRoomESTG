require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// --- MODELOS ---
const Ocupacao = require("./src/models/OcupacaoRaw"); 
// const Reserva = require("./src/models/Reserva"); // Descomenta quando tiveres reservas

// --- LIGAÇÃO À BD ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Ligado!"))
  .catch((err) => console.error("❌ Erro no Mongo:", err));

// ==========================================
//                 ROTAS
// ==========================================

app.get("/api/salas-livres", async (req, res) => {
  try {
    const { dia, hora } = req.query;

    if (!dia || !hora) return res.status(400).json({ error: "Falta dados." });

    // Regra do horário
    if (hora < "08:00" || hora > "23:00") return res.json([]); 

    // 1. LISTA MANUAL (Com detalhes bonitos)
    let dbSalas = [
      { nome: "S.1.1", piso: 1, lugares: 30 },
      { nome: "S.1.2", piso: 1, lugares: 24 },
      { nome: "S.1.3", piso: 1, lugares: 30 },
      { nome: "S.1.4", piso: 1, lugares: 40 },
      { nome: "S.1.5", piso: 1, lugares: 20 },
      { nome: "S.1.6", piso: 1, lugares: 30 },
      { nome: "S.1.7", piso: 1, lugares: 30 },
      { nome: "S.1.8", piso: 1, lugares: 30 },
      { nome: "S.2.1", piso: 2, lugares: 50 },
      { nome: "S.2.2", piso: 2, lugares: 50 },
      { nome: "S.2.3", piso: 2, lugares: 35 },
      { nome: "L.1.1", piso: 1, lugares: 15 },
      { nome: "Auditorio", piso: 0, lugares: 120 }
    ];

    console.log(`🔍 A processar salas para ${dia} às ${hora}...`);

    // 2. DESCOBRIR SALAS QUE EXISTEM NA BD (Mas não estão na lista manual)
    // O comando .distinct("sala") dá-nos uma lista de TODOS os nomes de salas que a BD conhece
    const todasSalasNaBD = await Ocupacao.distinct("sala");

    // Adicionar as salas "desconhecidas" à nossa lista
    todasSalasNaBD.forEach(nomeDaSala => {
        // Se a sala NÃO estiver na lista manual...
        if (!dbSalas.find(s => s.nome === nomeDaSala)) {
            // ... adicionamos com dados genéricos
            dbSalas.push({ 
                nome: nomeDaSala, 
                piso: "?", 
                lugares: "?" 
            });
        }
    });

    // 3. VER QUEM ESTÁ OCUPADO AGORA
    const ocupadasNomes = await Ocupacao.find({
      dia: dia,
      hora_inicio: { $lte: hora },
      hora_fim: { $gt: hora }
    }).distinct("sala");

    // 4. CRUZAR TUDO
    const resultado = dbSalas.map(sala => ({
      ...sala,
      sala: sala.nome, 
      status: ocupadasNomes.includes(sala.nome) ? "Ocupada" : "Livre",
      hora_consulta: hora
    }));

    // Ordenar por nome (S.1.1, S.1.2...) para ficar bonito
    resultado.sort((a, b) => a.nome.localeCompare(b.nome));

    res.json(resultado);

  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao processar salas.");
  }
});

// Rota de Debug (Opcional)
app.get("/api/debug-datas", async (req, res) => {
  const dias = await Ocupacao.distinct("dia");
  res.json(dias);
});

// --- ARRANCAR SERVIDOR ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor a correr na porta ${PORT}`));