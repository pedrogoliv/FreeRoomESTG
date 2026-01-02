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
const Reserva = require("./src/models/Reserva");

// ✅ NOVO: Modelo de Utilizador (com curso + email)
const UserSchema = new mongoose.Schema(
  {
    curso: { type: String, required: true },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // Em produção: bcrypt
    favoritos: { type: [String], default: [] }, // Lista de IDs das salas (ex: ["A.1.1", "B.2.3"])
  },
  { timestamps: true }
);

// Evita OverwriteModelError com nodemon/reloads
const User = mongoose.models.User || mongoose.model("User", UserSchema);

// --- 2. LIGAÇÃO À BD ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Ligado!"))
  .catch((err) => console.error("❌ Erro no Mongo:", err));

// ==========================================
//                 CURSOS
// ==========================================
const CURSOS = [
  "Engenharia Informática",
  "Engenharia Mecânica",
  "Engenharia Civil",
  "Engenharia Eletrotécnica e de Computadores",
  "Gestão",
  "Contabilidade",
  "Marketing",
  "Turismo",
];

// Lista de cursos para o frontend (autocomplete)
app.get("/api/cursos", (req, res) => {
  res.json({ success: true, cursos: CURSOS });
});

// ==========================================
//                 ROTAS DE UTILIZADOR
// ==========================================

async function registarHandler(req, res) {
  const { curso, username, email, password } = req.body;

  try {
    if (!curso || !username || !email || !password) {
      return res.status(400).json({ success: false, message: "Faltam campos obrigatórios." });
    }

    // Obriga a escolher um curso válido (mesmo que tentem bypass ao frontend)
    if (!CURSOS.includes(curso)) {
      return res.status(400).json({ success: false, message: "Curso inválido." });
    }

    const usernameTrim = String(username).trim();
    const emailNorm = String(email).trim().toLowerCase();

    // Username único
    const existingUser = await User.findOne({ username: usernameTrim });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Username já existe." });
    }

    // Email único
    const existingEmail = await User.findOne({ email: emailNorm });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: "Email já existe." });
    }

    const newUser = new User({
      curso,
      username: usernameTrim,
      email: emailNorm,
      password,
    });

    await newUser.save();

    return res.json({
      success: true,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        curso: newUser.curso,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao registar:", error);
    return res.status(500).json({ success: false, message: "Erro ao registar" });
  }
}

// REGISTAR (Cria o user no MongoDB Compass)
app.post("/auth/registar", registarHandler);

// LOGIN (COM DEBUG)
app.post("/auth/login", async (req, res) => {
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
    if (user.password !== password) {
      console.log("   ❌ ERRO: A password não coincide.");
      console.log(`      Esperada: '${user.password}' | Recebida: '${password}'`);
      return res.status(401).json({ success: false, message: "Password errada" });
    }

    console.log("   ✅ SUCESSO: Login aceite!");
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        curso: user.curso,
        favoritos: user.favoritos,
      },
    });
  } catch (error) {
    console.error("   🔥 CRASH:", error);
    res.status(500).json({ success: false, message: "Erro no servidor" });
  }
});

// ==========================================
//                 PERFIL / UTILIZADOR
// ==========================================

// OBTER DADOS DO UTILIZADOR (para o Perfil)
app.get("/api/users/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User não encontrado" });
    return res.json({ success: true, user });
  } catch (err) {
    console.error("❌ Erro ao buscar user:", err);
    return res.status(500).json({ success: false, message: "Erro no servidor" });
  }
});

// ATUALIZAR DADOS DO UTILIZADOR (curso/email)
app.put("/api/users/:username", async (req, res) => {
  try {
    const { curso, email } = req.body;

    if (curso && !CURSOS.includes(curso)) {
      return res.status(400).json({ success: false, message: "Curso inválido." });
    }

    let emailUpdate = undefined;
    if (email) {
      const emailNorm = String(email).trim().toLowerCase();
      const exists = await User.findOne({
        email: emailNorm,
        username: { $ne: req.params.username },
      });
      if (exists) {
        return res.status(400).json({ success: false, message: "Email já está a ser usado." });
      }
      emailUpdate = emailNorm;
    }

    const updated = await User.findOneAndUpdate(
      { username: req.params.username },
      {
        ...(curso ? { curso } : {}),
        ...(emailUpdate ? { email: emailUpdate } : {}),
      },
      { new: true }
    ).select("-password");

    if (!updated) return res.status(404).json({ success: false, message: "User não encontrado" });

    return res.json({ success: true, user: updated });
  } catch (err) {
    console.error("❌ Erro ao atualizar user:", err);
    return res.status(500).json({ success: false, message: "Erro no servidor" });
  }
});

// OBTER FAVORITOS
app.get("/api/favoritos/:username", async (req, res) => {
  try {
    // Busca pelo campo 'username' em vez do ID
    const user = await User.findOne({ username: req.params.username });
    res.json(user ? user.favoritos : []);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar favoritos" });
  }
});

// FAVORITOS (Adicionar/Remover por nome)
app.post("/api/favoritos", async (req, res) => {
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
//              ROTAS DE RESERVAS
// ==========================================

// Funções utilitárias
const isWeekend = (isoDate) => {
  const d = new Date(`${isoDate}T00:00:00`);
  const day = d.getDay(); // 0=Domingo, 6=Sábado
  return day === 0 || day === 6;
};

const FERIADOS = require("./src/config/feriadosPT");
const isFeriado = (isoDate) => FERIADOS.has(isoDate);

const toMinutes = (t) => {
  // aceita "HH:MM" ou "HH:MM:SS"
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

app.post("/api/reservar", async (req, res) => {
  try {
    const { sala, dia, hora_inicio, hora_fim } = req.body;

    if (!sala || !dia || !hora_inicio || !hora_fim) {
      return res.status(400).json({ erro: "Faltam campos obrigatórios." });
    }

    // BLOQUEIO: fim-de-semana / feriados
    if (isWeekend(dia)) {
      return res
        .status(400)
        .json({ erro: "Não é possível reservar salas ao fim-de-semana." });
    }

    if (isFeriado(dia)) {
      return res.status(400).json({ erro: "Não é possível reservar salas em feriados." });
    }

    // validação de horas
    const novoIni = toMinutes(hora_inicio);
    const novoFim = toMinutes(hora_fim);

    if (Number.isNaN(novoIni) || Number.isNaN(novoFim)) {
      return res.status(400).json({ erro: "Hora inválida." });
    }

    if (novoFim <= novoIni) {
      return res
        .status(400)
        .json({ erro: "hora_fim tem de ser maior que hora_inicio." });
    }

    // Buscar aulas e reservas existentes para a mesma sala/dia
    const aulas = await Ocupacao.find({ sala, dia });
    const reservas = await Reserva.find({ sala, dia });

    // Normalizar tudo
    const ocupacoes = [
      ...aulas.map((a) => ({ inicio: a.hora_inicio, fim: a.hora_fim })),
      ...reservas.map((r) => ({ inicio: r.hora_inicio, fim: r.hora_fim })),
    ];

    // Overlap
    const conflito = ocupacoes.some((o) => {
      const ini = toMinutes(o.inicio);
      const fim = toMinutes(o.fim);
      return novoIni < fim && novoFim > ini;
    });

    if (conflito) {
      return res.status(409).json({ erro: "Sala já está ocupada nesse horário." });
    }

    // Guardar reserva
    const novaReserva = await Reserva.create(req.body);
    return res.status(201).json({ mensagem: "Reserva criada!", dados: novaReserva });
  } catch (err) {
    console.error("❌ Erro ao criar reserva:", err);
    return res.status(500).json({ erro: "Erro no servidor: " + err.message });
  }
});

// ==========================================
//                 ROTAS DE SALAS
// ==========================================

app.get("/api/salas-livres", async (req, res) => {
  try {
    const { dia, hora } = req.query;

    if (isWeekend(dia) || isFeriado(dia)) {
      return res.json([]);
    }

    if (!dia || !hora) return res.status(400).json({ error: "Falta dados." });

    // 1. A TUA LISTA MANUAL
    let dbSalas = [
      { nome: "S.1.1", piso: 1, lugares: 30 },
      // ... outras salas manuais ...
    ];

    // 2. BUSCAR TODAS AS SALAS QUE EXISTEM NA BD
    const todasSalasNaBD = await Ocupacao.distinct("sala");

    // 3. ADICIONAR AS SALAS NOVAS (Lógica Inteligente)
    todasSalasNaBD.forEach((nomeDaSala) => {
      if (!dbSalas.find((s) => s.nome === nomeDaSala)) {
        let pisoAdivinhado = "?";
        const partes = nomeDaSala.split(".");
        if (partes.length >= 2 && !isNaN(partes[1])) {
          pisoAdivinhado = partes[1];
        }
        dbSalas.push({
          nome: nomeDaSala,
          piso: pisoAdivinhado,
          lugares: "30",
        });
      }
    });

    // 4. VERIFICA OCUPAÇÃO (No Compass: collection 'ocupacoes')
    const ocupadasNomes = await Ocupacao.find({
      dia: dia,
      hora_inicio: { $lte: hora },
      hora_fim: { $gt: hora },
    }).distinct("sala");

    const resultado = dbSalas.map((sala) => ({
      ...sala,
      sala: sala.nome,
      status: ocupadasNomes.includes(sala.nome) ? "Ocupada" : "Livre",
    }));

    resultado.sort((a, b) => a.nome.localeCompare(b.nome));

    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro.");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor a correr na porta ${PORT}`));
