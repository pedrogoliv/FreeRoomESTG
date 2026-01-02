require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. MODELOS ---
// O teu modelo de ocupações existente
const Ocupacao = require("./src/models/OcupacaoRaw"); 

// ✅ NOVO: Modelo de Utilizador (Definido aqui mesmo para ser mais rápido)
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Em produção usaria bcrypt
  favoritos: { type: [String], default: [] }  // Lista de IDs das salas (ex: ["A.1.1", "B.2.3"])
});

// Cria a coleção 'users' na tua BD freeroom_estg
const User = mongoose.model('User', UserSchema);


// --- 2. LIGAÇÃO À BD ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Ligado!"))
  .catch((err) => console.error("❌ Erro no Mongo:", err));


// ==========================================
//                 ROTAS DE UTILIZADOR
// ==========================================

// 👉 REGISTAR (Cria o user no MongoDB Compass)
app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ success: false, message: "User já existe" });

    const newUser = new User({ username, password });
    await newUser.save();

    res.json({ success: true, user: { id: newUser._id, username: newUser.username } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao registar" });
  }
});

// 👉 LOGIN (COM DEBUG)
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;

  console.log("------------------------------------------------");
  console.log("🔍 TENTATIVA DE LOGIN:");
  console.log("   📩 Recebi do Frontend:", { username, password });

  try {
    // 1. Tenta encontrar SÓ pelo username primeiro para ver se o user existe
    const user = await User.findOne({ username: username });

    console.log("   🗄️  O que o MongoDB encontrou:", user);

    if (!user) {
      console.log("   ❌ ERRO: Utilizador não encontrado na coleção 'users'.");
      return res.status(401).json({ success: false, message: "Utilizador não encontrado" });
    }

    // 2. Se o user existe, verifica a password
    // Nota: verifica se no teu mongo o campo chama-se mesmo "password"
    if (user.password !== password) {
      console.log("   ❌ ERRO: A password não coincide.");
      console.log(`      Esperada: '${user.password}' | Recebida: '${password}'`);
      return res.status(401).json({ success: false, message: "Password errada" });
    }

    console.log("   ✅ SUCESSO: Login aceite!");
    res.json({ success: true, user: { id: user._id, username: user.username } });

  } catch (error) {
    console.error("   🔥 CRASH:", error);
    res.status(500).json({ success: false, message: "Erro no servidor" });
  }
});

// 👉 OBTER FAVORITOS
app.get('/api/favoritos/:username', async (req, res) => {
  try {
    // Busca pelo campo 'username' em vez do ID
    const user = await User.findOne({ username: req.params.username });
    res.json(user ? user.favoritos : []);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar favoritos" });
  }
});

// 👉 TOGGLE FAVORITOS (Adicionar/Remover por nome)
app.post('/api/favoritos', async (req, res) => {
  const { username, salaId } = req.body; // 👈 Recebe username

  console.log("---------------------------------------");
  console.log("❤️ PEDIDO FAVORITO (VIA USERNAME)");
  console.log("   👤 User:", username);
  console.log("   🏫 Sala:", salaId);

  if (!username || !salaId) {
    return res.status(400).json({ success: false, message: "Faltam dados." });
  }

  try {
    // 1. Procura o utilizador
    const user = await User.findOne({ username });
    
    if (!user) {
      console.log("   ❌ ERRO: User não encontrado.");
      return res.status(404).json({ success: false, message: "User não encontrado" });
    }

    // 2. Lógica de Adicionar/Remover
    // Usamos comandos do Mongo ($pull e $addToSet) para ser mais seguro
    const jaExiste = user.favoritos.includes(salaId);

    if (jaExiste) {
      await User.updateOne({ username }, { $pull: { favoritos: salaId } });
      console.log("   🗑️  Removido.");
    } else {
      await User.updateOne({ username }, { $addToSet: { favoritos: salaId } });
      console.log("   💾 Adicionado.");
    }

    // 3. Devolve a lista atualizada
    const userAtualizado = await User.findOne({ username });
    res.json({ success: true, favoritos: userAtualizado.favoritos });

  } catch (error) {
    console.error("   🔥 ERRO:", error);
    res.status(500).json({ success: false, message: "Erro no servidor" });
  }
});


// ==========================================
//                 ROTAS DE SALAS
// ==========================================

app.get("/api/salas-livres", async (req, res) => {
  try {
    const { dia, hora } = req.query;
    if (!dia || !hora) return res.status(400).json({ error: "Falta dados." });

    // 1. A TUA LISTA MANUAL
    let dbSalas = [
      { nome: "S.1.1", piso: 1, lugares: 30 },
      // ... outras salas manuais ...
    ];

    // 2. BUSCAR TODAS AS SALAS QUE EXISTEM NA BD
    const todasSalasNaBD = await Ocupacao.distinct("sala");

    // 3. ADICIONAR AS SALAS NOVAS (Lógica Inteligente)
    todasSalasNaBD.forEach(nomeDaSala => {
        if (!dbSalas.find(s => s.nome === nomeDaSala)) {
            let pisoAdivinhado = "?";
            const partes = nomeDaSala.split('.');
            if (partes.length >= 2 && !isNaN(partes[1])) {
                pisoAdivinhado = partes[1];
            }
            dbSalas.push({ 
                nome: nomeDaSala, 
                piso: pisoAdivinhado, 
                lugares: "30" 
            });
        }
    });

    // 4. VERIFICA OCUPAÇÃO (No Compass: collection 'ocupacoes')
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

    // Ordenar
    resultado.sort((a, b) => a.nome.localeCompare(b.nome));

    res.json(resultado);

  } catch (err) {
    console.error(err);
    res.status(500).send("Erro.");
  }
});

// --- ARRANCAR SERVIDOR ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor a correr na porta ${PORT}`));