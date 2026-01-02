require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. MODELOS ---
const Ocupacao = require("./src/models/OcupacaoRaw");
const Reserva = require("./src/models/Reserva");

// ✅ Modelo Curso (coleção "cursos")
const Curso = require("./src/models/Curso");

// ✅ Modelo User (com curso + email + numero)
const UserSchema = new mongoose.Schema(
  {
    curso: { type: String, required: true },

    // ✅ NOVO: número do aluno (string para não perder zeros)
    numero: { type: String, required: true, unique: true, trim: true },

    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // Em produção: bcrypt
    favoritos: { type: [String], default: [] },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

// --- 2. LIGAÇÃO À BD ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Ligado!"))
  .catch((err) => console.error("❌ Erro no Mongo:", err));

// ==========================================
//                 CURSOS (SEED)
// ==========================================
const CURSOS_SEED = [
  "Design de Ambientes",
  "Design do Produto",
  "Engenharia Alimentar",
  "Engenharia Civil e do Ambiente",
  "Engenharia da Computação Gráfica e Multimédia",
  "Engenharia de Redes e Sistemas de Computadores",
  "Engenharia Informática",
  "Engenharia Mecânica",
  "Engenharia Mecatrónica",
  "Gastronomia e Artes Culinárias",
  "Gestão",
  "Gestão (nocturno)",
  "Tecnologia Alimentar e Nutrição",
  "Turismo",
];

async function seedCursosIfEmpty() {
  try {
    const count = await Curso.countDocuments();
    if (count === 0) {
      await Curso.insertMany(CURSOS_SEED.map((nome) => ({ nome })));
      console.log("✅ Cursos inseridos na BD (seed inicial).");
    }
  } catch (e) {
    console.error("❌ Erro a seedar cursos:", e);
  }
}

mongoose.connection.once("open", () => {
  seedCursosIfEmpty();
});

// GET cursos para o frontend (react-select)
app.get("/api/cursos", async (req, res) => {
  try {
    const cursos = await Curso.find().sort({ nome: 1 }).select("nome -_id");
    res.json({ success: true, cursos: cursos.map((c) => c.nome) });
  } catch (e) {
    console.error("❌ Erro /api/cursos:", e);
    res.status(500).json({ success: false, message: "Erro ao obter cursos" });
  }
});

// ==========================================
//            ROTAS DE UTILIZADOR
// ==========================================

async function registarHandler(req, res) {
  const { curso, numero, username, email, password } = req.body;

  try {
    if (!curso || !numero || !username || !email || !password) {
      return res.status(400).json({ success: false, message: "Faltam campos obrigatórios." });
    }

    // ✅ Valida no Mongo se o curso existe MESMO
    const existeCurso = await Curso.exists({ nome: curso });
    if (!existeCurso) {
      return res.status(400).json({ success: false, message: "Curso inválido." });
    }

    // ✅ Validação do número (só dígitos)
    const numeroNorm = String(numero).trim();
    if (!/^\d+$/.test(numeroNorm)) {
      return res
        .status(400)
        .json({ success: false, message: "Número inválido (apenas dígitos)." });
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

    // ✅ Número único
    const existingNumero = await User.findOne({ numero: numeroNorm });
    if (existingNumero) {
      return res.status(400).json({ success: false, message: "Esse número já está registado." });
    }

    const newUser = new User({
      curso,
      numero: numeroNorm,
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
        numero: newUser.numero,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao registar:", error);
    return res.status(500).json({ success: false, message: "Erro ao registar" });
  }
}

// compatível com /auth/registar e /auth/register
app.post("/auth/registar", registarHandler);
app.post("/auth/register", registarHandler);

// LOGIN
app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ success: false, message: "Utilizador não encontrado" });
    }

    if (user.password !== password) {
      return res.status(401).json({ success: false, message: "Password errada" });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        curso: user.curso,
        numero: user.numero, 
        favoritos: user.favoritos,
      },
    });
  } catch (error) {
    console.error("🔥 CRASH:", error);
    res.status(500).json({ success: false, message: "Erro no servidor" });
  }
});

// ==========================================
//              PERFIL / UTILIZADOR
// ==========================================

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

// Agora também permite atualizar numero
app.put("/api/users/:username", async (req, res) => {
  try {
    const { curso, email, numero } = req.body;

    // validar curso pela BD
    if (curso) {
      const existeCurso = await Curso.exists({ nome: curso });
      if (!existeCurso) {
        return res.status(400).json({ success: false, message: "Curso inválido." });
      }
    }

    // validar email se vier
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

    // validar numero se vier
    let numeroUpdate = undefined;
    if (numero !== undefined) {
      const numeroNorm = String(numero).trim();
      if (!/^\d+$/.test(numeroNorm)) {
        return res
          .status(400)
          .json({ success: false, message: "Número inválido (apenas dígitos)." });
      }

      const existsNumero = await User.findOne({
        numero: numeroNorm,
        username: { $ne: req.params.username },
      });
      if (existsNumero) {
        return res
          .status(400)
          .json({ success: false, message: "Esse número já está registado." });
      }

      numeroUpdate = numeroNorm;
    }

    const updated = await User.findOneAndUpdate(
      { username: req.params.username },
      {
        ...(curso ? { curso } : {}),
        ...(emailUpdate ? { email: emailUpdate } : {}),
        ...(numeroUpdate ? { numero: numeroUpdate } : {}),
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

// ==========================================
//                 FAVORITOS
// ==========================================

app.get("/api/favoritos/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    res.json(user ? user.favoritos : []);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar favoritos" });
  }
});

app.post("/api/favoritos", async (req, res) => {
  const { username, salaId } = req.body;

  if (!username || !salaId) {
    return res.status(400).json({ success: false, message: "Faltam dados." });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ success: false, message: "User não encontrado" });

    const jaExiste = user.favoritos.includes(salaId);

    if (jaExiste) {
      await User.updateOne({ username }, { $pull: { favoritos: salaId } });
    } else {
      await User.updateOne({ username }, { $addToSet: { favoritos: salaId } });
    }

    const userAtualizado = await User.findOne({ username });
    res.json({ success: true, favoritos: userAtualizado.favoritos });
  } catch (error) {
    console.error("🔥 ERRO:", error);
    res.status(500).json({ success: false, message: "Erro no servidor" });
  }
});

// ==========================================
//              ROTAS DE RESERVAS
// ==========================================

const isWeekend = (isoDate) => {
  const d = new Date(`${isoDate}T00:00:00`);
  const day = d.getDay();
  return day === 0 || day === 6;
};

const FERIADOS = require("./src/config/feriadosPT");
const isFeriado = (isoDate) => FERIADOS.has(isoDate);

const toMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

app.post("/api/reservar", async (req, res) => {
  try {
    const { sala, dia, hora_inicio, hora_fim } = req.body;

    if (!sala || !dia || !hora_inicio || !hora_fim) {
      return res.status(400).json({ erro: "Faltam campos obrigatórios." });
    }

    if (isWeekend(dia)) {
      return res.status(400).json({ erro: "Não é possível reservar salas ao fim-de-semana." });
    }

    if (isFeriado(dia)) {
      return res.status(400).json({ erro: "Não é possível reservar salas em feriados." });
    }

    const novoIni = toMinutes(hora_inicio);
    const novoFim = toMinutes(hora_fim);

    if (Number.isNaN(novoIni) || Number.isNaN(novoFim)) {
      return res.status(400).json({ erro: "Hora inválida." });
    }

    if (novoFim <= novoIni) {
      return res.status(400).json({ erro: "hora_fim tem de ser maior que hora_inicio." });
    }

    const aulas = await Ocupacao.find({ sala, dia });
    const reservas = await Reserva.find({ sala, dia });

    const ocupacoes = [
      ...aulas.map((a) => ({ inicio: a.hora_inicio, fim: a.hora_fim })),
      ...reservas.map((r) => ({ inicio: r.hora_inicio, fim: r.hora_fim })),
    ];

    const conflito = ocupacoes.some((o) => {
      const ini = toMinutes(o.inicio);
      const fim = toMinutes(o.fim);
      return novoIni < fim && novoFim > ini;
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

// ==========================================
//                 ROTAS DE SALAS
// ==========================================

app.get("/api/salas-livres", async (req, res) => {
  try {
    const { dia, hora } = req.query;

    if (!dia || !hora) return res.status(400).json({ error: "Falta dados." });

    if (isWeekend(dia) || isFeriado(dia)) {
      return res.json([]);
    }

    let dbSalas = [{ nome: "S.1.1", piso: 1, lugares: 30 }];

    const todasSalasNaBD = await Ocupacao.distinct("sala");

    todasSalasNaBD.forEach((nomeDaSala) => {
      if (!dbSalas.find((s) => s.nome === nomeDaSala)) {
        let pisoAdivinhado = "?";
        const partes = nomeDaSala.split(".");
        if (partes.length >= 2 && !isNaN(partes[1])) pisoAdivinhado = partes[1];

        dbSalas.push({ nome: nomeDaSala, piso: pisoAdivinhado, lugares: "30" });
      }
    });

    const ocupadasNomes = await Ocupacao.find({
      dia,
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
