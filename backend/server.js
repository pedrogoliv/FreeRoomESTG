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

    // 1. A TUA LISTA MANUAL (Salas especiais ou com lotação específica)
    let dbSalas = [
      { nome: "S.1.1", piso: 1, lugares: 30 },
      // ... podes manter as que já tinhas se quiseres
    ];

    // 2. BUSCAR TODAS AS SALAS QUE EXISTEM NA BD
    const todasSalasNaBD = await Ocupacao.distinct("sala");

    // 3. ADICIONAR AS SALAS NOVAS (COM "INTELIGÊNCIA ARTIFICIAL" DE PISO 🧠)
    todasSalasNaBD.forEach(nomeDaSala => {
        // Só adiciona se ainda não estiver na lista manual
        if (!dbSalas.find(s => s.nome === nomeDaSala)) {
            
            // Tenta adivinhar o piso pelo nome (ex: "S.2.3" -> Pega no "2")
            let pisoAdivinhado = "?";
            const partes = nomeDaSala.split('.'); // Parte o nome nos pontos
            if (partes.length >= 2 && !isNaN(partes[1])) {
                pisoAdivinhado = partes[1]; // O segundo número costuma ser o piso
            }

            dbSalas.push({ 
                nome: nomeDaSala, 
                piso: pisoAdivinhado, 
                lugares: "30" // Valor padrão para não ficar "?" (ou mete "N/A")
            });
        }
    });

    // ... (O resto do código de verificar ocupação mantém-se igual) ...
    
    // 4. VERIFICA OCUPAÇÃO
    const ocupadasNomes = await Ocupacao.find({
      dia: dia,
      hora_inicio: { $lte: hora },
      hora_fim: { $gt: hora }
    }).distinct("sala");

    const resultado = dbSalas.map(sala => ({
      ...sala,
      sala: sala.nome, 
      status: ocupadasNomes.includes(sala.nome) ? "Ocupada" : "Livre",
    }));

    // Ordenar alfabeticamente
    resultado.sort((a, b) => a.nome.localeCompare(b.nome));

    res.json(resultado);

  } catch (err) {
    console.error(err);
    res.status(500).send("Erro.");
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