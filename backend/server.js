require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ---  MODELOS ---
const Ocupacao = require("./src/models/OcupacaoRaw");
const Reserva = require("./src/models/Reserva");
const Curso = require("./src/models/Curso");

// --- USER (inline) ---
// ✅ SEM email
const UserSchema = new mongoose.Schema(
  {
    curso: { type: String, required: true, trim: true },
    numero: { type: String, required: false, unique: true, sparse: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },

    password: { type: String, required: true }, // em produção: bcrypt
    favoritos: { type: [String], default: [] },
    tipo: { type: String, default: "aluno" },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

// --- LIGAÇÃO À BD ---
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
//            ROTAS DE UTILIZADOR (AUTH)
// ==========================================
async function registarHandler(req, res) {
  const { curso, numero, username, password } = req.body;

  try {
    if (!curso || !username || !password) {
      return res.status(400).json({ success: false, message: "Faltam campos obrigatórios." });
    }

    // curso válido
    const cursoNorm = String(curso).trim();
    const existeCurso = await Curso.exists({ nome: cursoNorm });
    if (!existeCurso) {
      return res.status(400).json({ success: false, message: "Curso inválido." });
    }

    // ✅ mantém numero obrigatório no registo (como tinhas)
    if (numero === undefined || numero === null || String(numero).trim() === "") {
      return res.status(400).json({ success: false, message: "Número é obrigatório." });
    }

    const numeroNorm = String(numero).trim();
    if (!/^\d+$/.test(numeroNorm)) {
      return res.status(400).json({ success: false, message: "Número inválido (apenas dígitos)." });
    }

    const usernameTrim = String(username).trim();

    const existingUser = await User.findOne({ username: usernameTrim });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Username já existe." });
    }

    // ✅ faltava isto no teu ficheiro: validação do número único
    const existingNumero = await User.findOne({ numero: numeroNorm });
    if (existingNumero) {
      return res.status(400).json({ success: false, message: "Esse número já está registado." });
    }

    const newUser = new User({
      curso: cursoNorm,
      numero: numeroNorm,
      username: usernameTrim,
      password,
      favoritos: [],
    });

    await newUser.save();

    return res.json({
      success: true,
      user: {
        id: newUser._id,
        username: newUser.username,
        curso: newUser.curso,
        numero: newUser.numero,
        favoritos: newUser.favoritos,
        tipo: newUser.tipo,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao registar:", error);
    return res.status(500).json({ success: false, message: "Erro ao registar" });
  }
}

app.post("/auth/registar", registarHandler);
app.post("/auth/register", registarHandler);

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username: String(username).trim() });

    if (!user) {
      return res.status(401).json({ success: false, message: "Utilizador não encontrado" });
    }

    if (user.password !== password) {
      return res.status(401).json({ success: false, message: "Password errada" });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        curso: user.curso,
        numero: user.numero,
        favoritos: user.favoritos,
        tipo: user.tipo,
      },
    });
  } catch (error) {
    console.error("🔥 CRASH:", error);
    return res.status(500).json({ success: false, message: "Erro no servidor" });
  }
});

// ==========================================
//              PERFIL / UTILIZADOR
// ==========================================

// GET user
app.get("/api/users/:username", async (req, res) => {
  try {
    const u = await User.findOne({ username: req.params.username }).select("-password");
    if (!u) return res.status(404).json({ success: false, message: "User não encontrado" });
    return res.json({ success: true, user: u });
  } catch (err) {
    console.error("❌ Erro GET user:", err);
    return res.status(500).json({ success: false, message: "Erro no servidor" });
  }
});

// ✅ PUT user (sem email)
app.put("/api/users/:username", async (req, res) => {
  try {
    const { curso, numero } = req.body;

    const updates = {};

    // curso: se vier no body, valida e atualiza
    if (curso !== undefined) {
      const cursoNorm = String(curso).trim();
      if (!cursoNorm) {
        return res.status(400).json({ success: false, message: "Curso é obrigatório." });
      }

      const existeCurso = await Curso.exists({ nome: cursoNorm });
      if (!existeCurso) {
        return res.status(400).json({ success: false, message: "Curso inválido." });
      }

      updates.curso = cursoNorm;
    }

    // numero: pode ser null/"" para limpar
    if (numero !== undefined) {
      if (numero === null || String(numero).trim() === "") {
        updates.numero = null;
      } else {
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

        updates.numero = numeroNorm;
      }
    }

    const updated = await User.findOneAndUpdate(
      { username: req.params.username },
      updates,
      { new: true }
    ).select("-password");

    if (!updated) {
      return res.status(404).json({ success: false, message: "User não encontrado" });
    }

    return res.json({ success: true, user: updated });
  } catch (err) {
    console.error("❌ Erro ao atualizar user:", err);
    return res.status(500).json({ success: false, message: "Erro no servidor" });
  }
});

// stats (para o modal no Perfil)
app.get("/api/users/:username/stats", async (req, res) => {
  try {
    const { username } = req.params;

    const reservas = await Reserva.find({ responsavel: username, status: { $ne: "cancelada" } });

    const totalReservas = reservas.length;

    const toMinutesLocal = (t) => {
      const [h, m] = String(t).split(":").map(Number);
      return h * 60 + m;
    };

    let totalMin = 0;
    const salaCount = {};
    const diaCount = {};

    for (const r of reservas) {
      if (r?.hora_inicio && r?.hora_fim) {
        const diff = toMinutesLocal(r.hora_fim) - toMinutesLocal(r.hora_inicio);
        if (diff > 0) totalMin += diff;
      }
      const sala = String(r.sala || "");
      if (sala) salaCount[sala] = (salaCount[sala] || 0) + 1;

      const dia = String(r.dia || "");
      if (dia) diaCount[dia] = (diaCount[dia] || 0) + 1;
    }

    const totalHoras = Math.round((totalMin / 60) * 10) / 10;

    const salaTop =
      Object.entries(salaCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    const diaTop =
      Object.entries(diaCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    return res.json({
      success: true,
      stats: { totalReservas, totalHoras, salaTop, diaTop },
    });
  } catch (err) {
    console.error("❌ Erro stats:", err);
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
//              ROTAS DE RESERVAS (CORE)
// ==========================================
const isWeekend = (isoDate) => {
  const d = new Date(`${isoDate}T00:00:00`);
  const day = d.getDay();
  return day === 0 || day === 6;
};

const FERIADOS = require("./src/config/feriadosPT");
const isFeriado = (isoDate) => FERIADOS.has(isoDate);

app.get("/api/feriados", (req, res) => {
  res.json({ success: true, feriados: Array.from(FERIADOS) });
});

const toMinutes = (t) => {
  const [h, m] = String(t).split(":").map(Number);
  return h * 60 + m;
};

const CAP_BASE = 15;

function consumoReserva(pessoas) {
  const p = Number(pessoas) || 1;
  const penalty = Math.floor((p - 1) / 3);
  return p + penalty;
}

function isValidTimeHHMM(t) {
  return typeof t === "string" && /^\d{2}:\d{2}$/.test(t);
}

function addMinutesHHMM(hhmm, minutesToAdd) {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + minutesToAdd;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

// criar reserva
app.post("/api/reservar", async (req, res) => {
  try {
    const { sala, dia, hora_inicio, hora_fim, pessoas, responsavel, motivo } = req.body;

    if (!sala || !dia || !hora_inicio || !hora_fim) {
      return res.status(400).json({ erro: "Faltam campos obrigatórios." });
    }

    if (!responsavel || String(responsavel).trim() === "") {
      return res.status(400).json({ erro: "Falta o responsável (username)." });
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

    const nPessoas = Number(pessoas ?? 1);
    if (!Number.isInteger(nPessoas) || nPessoas < 1) {
      return res.status(400).json({ erro: "Campo 'pessoas' inválido." });
    }

    // AULAS BLOQUEIAM
    const aulas = await Ocupacao.find({ sala, dia });
    const aulaConflito = aulas.some((a) => {
      const ini = toMinutes(a.hora_inicio);
      const fim = toMinutes(a.hora_fim);
      return novoIni < fim && novoFim > ini;
    });

    if (aulaConflito) {
      return res.status(409).json({ erro: "Sala tem aula nesse horário." });
    }

    // RESERVAS EXISTENTES (ignora canceladas)
    const reservas = await Reserva.find({ sala, dia, status: "ativa" });

    const reservasOverlap = reservas.filter((r) => {
      const ini = toMinutes(r.hora_inicio);
      const fim = toMinutes(r.hora_fim);
      return novoIni < fim && novoFim > ini;
    });

    const consumoOcupado = reservasOverlap.reduce((sum, r) => {
      const p = r.pessoas ?? 1;
      return sum + consumoReserva(p);
    }, 0);

    const consumoNovo = consumoReserva(nPessoas);
    const sobra = CAP_BASE - consumoOcupado;

    if (consumoNovo > sobra) {
      return res.status(409).json({
        erro: `Capacidade excedida. Espaço disponível (com regra de grupos): ${Math.max(0, sobra)}.`,
      });
    }

    const novaReserva = await Reserva.create({
      sala,
      dia,
      hora_inicio,
      hora_fim,
      pessoas: nPessoas,
      responsavel: String(responsavel).trim(),
      motivo: motivo ? String(motivo).trim() : "",
      status: "ativa",
      canceledAt: null,
    });

    return res.status(201).json({ success: true, mensagem: "Reserva criada!", dados: novaReserva });
  } catch (err) {
    console.error("❌ Erro ao criar reserva:", err);
    return res.status(500).json({ erro: "Erro no servidor: " + err.message });
  }
});

// ==========================================
//     MINHAS RESERVAS (GET / PUT / DELETE)
// ==========================================

app.get("/api/reservas/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const reservas = await Reserva.find({
      responsavel: username,
      status: { $ne: "cancelada" },
    }).sort({ dia: 1, hora_inicio: 1 });

    return res.json({ success: true, reservas });
  } catch (err) {
    console.error("❌ Erro ao buscar reservas:", err);
    return res.status(500).json({ success: false, message: "Erro no servidor" });
  }
});

app.put("/api/reservas/:reservaId", async (req, res) => {
  try {
    const { reservaId } = req.params;
    const { pessoas, dia, hora_inicio } = req.body;

    const reserva = await Reserva.findById(reservaId);
    if (!reserva) {
      return res.status(404).json({ success: false, message: "Reserva não encontrada." });
    }
    if (reserva.status === "cancelada") {
      return res.status(400).json({ success: false, message: "Não podes editar uma reserva cancelada." });
    }

    if (pessoas !== undefined) {
      const p = Number(pessoas);
      if (!Number.isFinite(p) || p < 1) {
        return res.status(400).json({ success: false, message: "Número de pessoas inválido." });
      }
      reserva.pessoas = p;
    }

    const querMudarDia = dia !== undefined;
    const querMudarHora = hora_inicio !== undefined;

    if (querMudarDia) {
      const diaNorm = String(dia).trim();
      if (!diaNorm) return res.status(400).json({ success: false, message: "Dia inválido." });
      if (isWeekend(diaNorm)) {
        return res.status(400).json({ success: false, message: "Não é possível reservar ao fim-de-semana." });
      }
      if (isFeriado(diaNorm)) {
        return res.status(400).json({ success: false, message: "Não é possível reservar em feriados." });
      }
      reserva.dia = diaNorm;
    }

    if (querMudarHora) {
      const horaNorm = String(hora_inicio).trim();
      if (!isValidTimeHHMM(horaNorm)) {
        return res.status(400).json({ success: false, message: "Hora início inválida (HH:MM)." });
      }
      reserva.hora_inicio = horaNorm;
    }

    if (querMudarDia || querMudarHora) {
      let duracaoMin = 30;
      if (isValidTimeHHMM(reserva.hora_inicio) && isValidTimeHHMM(reserva.hora_fim)) {
        const diff = toMinutes(reserva.hora_fim) - toMinutes(reserva.hora_inicio);
        if (diff > 0) duracaoMin = diff;
      }

      const novaHoraFim = addMinutesHHMM(reserva.hora_inicio, duracaoMin);

      const aulas = await Ocupacao.find({ sala: reserva.sala, dia: reserva.dia });
      const iniNovo = toMinutes(reserva.hora_inicio);
      const fimNovo = toMinutes(novaHoraFim);

      const aulaConflito = aulas.some((a) => {
        const ini = toMinutes(a.hora_inicio);
        const fim = toMinutes(a.hora_fim);
        return iniNovo < fim && fimNovo > ini;
      });

      if (aulaConflito) {
        return res.status(409).json({ success: false, message: "Sala tem aula nesse horário." });
      }

      const reservas = await Reserva.find({
        _id: { $ne: reserva._id },
        sala: reserva.sala,
        dia: reserva.dia,
        status: "ativa",
      });

      const overlap = reservas.filter((r) => {
        const ini = toMinutes(r.hora_inicio);
        const fim = toMinutes(r.hora_fim);
        return iniNovo < fim && fimNovo > ini;
      });

      const consumoOcupado = overlap.reduce((sum, r) => sum + consumoReserva(r.pessoas ?? 1), 0);
      const consumoNovo = consumoReserva(reserva.pessoas ?? 1);
      const sobra = CAP_BASE - consumoOcupado;

      if (consumoNovo > sobra) {
        return res.status(409).json({
          success: false,
          message: `Capacidade excedida. Espaço disponível (com regra de grupos): ${Math.max(0, sobra)}.`,
        });
      }

      reserva.hora_fim = novaHoraFim;
    }

    await reserva.save();
    return res.json({ success: true, reserva });
  } catch (err) {
    console.error("❌ Erro ao atualizar reserva:", err);
    return res.status(500).json({ success: false, message: "Erro no servidor" });
  }
});

app.delete("/api/reservas/:reservaId", async (req, res) => {
  try {
    const { reservaId } = req.params;

    const reserva = await Reserva.findById(reservaId);
    if (!reserva) {
      return res.status(404).json({ success: false, message: "Reserva não encontrada." });
    }

    if (reserva.status === "cancelada") {
      return res.json({ success: true, reserva });
    }

    reserva.status = "cancelada";
    reserva.canceledAt = new Date();
    await reserva.save();

    return res.json({ success: true, reserva });
  } catch (err) {
    console.error("❌ Erro ao cancelar reserva:", err);
    return res.status(500).json({ success: false, message: "Erro no servidor" });
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

    let dbSalas = [{ nome: "S.1.1", piso: 1, lugares: CAP_BASE }];

    const todasSalasNaBD = await Ocupacao.distinct("sala");
    todasSalasNaBD.forEach((nomeDaSala) => {
      if (!dbSalas.find((s) => s.nome === nomeDaSala)) {
        let pisoAdivinhado = "?";
        const partes = nomeDaSala.split(".");
        if (partes.length >= 2 && !isNaN(partes[1])) pisoAdivinhado = partes[1];
        dbSalas.push({ nome: nomeDaSala, piso: pisoAdivinhado, lugares: CAP_BASE });
      }
    });

    const ocupadasAula = await Ocupacao.find({
      dia,
      hora_inicio: { $lte: hora },
      hora_fim: { $gt: hora },
    }).distinct("sala");

    const reservasDia = await Reserva.find({ dia, status: "ativa" });

    const consumoPorSala = {};
    for (const r of reservasDia) {
      const ini = toMinutes(r.hora_inicio);
      const fim = toMinutes(r.hora_fim);
      const h = toMinutes(hora);

      if (h >= ini && h < fim) {
        const p = r.pessoas ?? 1;
        consumoPorSala[r.sala] = (consumoPorSala[r.sala] || 0) + consumoReserva(p);
      }
    }

    const resultado = dbSalas.map((s) => {
      const salaNome = s.nome;

      if (ocupadasAula.includes(salaNome)) {
        return { ...s, sala: salaNome, status: "Ocupada", lugaresDisponiveis: 0 };
      }

      const consumo = consumoPorSala[salaNome] || 0;
      const livres = Math.max(0, CAP_BASE - consumo);

      return {
        ...s,
        sala: salaNome,
        status: livres > 0 ? "Livre" : "Ocupada",
        lugaresDisponiveis: livres,
      };
    });

    resultado.sort((a, b) => a.nome.localeCompare(b.nome));
    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro.");
  }
});

app.get("/api/salas", async (req, res) => {
  try {
    const salasOcup = await Ocupacao.distinct("sala");
    const salasRes = await Reserva.distinct("sala");

    const salas = Array.from(new Set([...salasOcup, ...salasRes]))
      .filter(Boolean)
      .sort((a, b) => String(a).localeCompare(String(b)));

    const parsePiso = (nome) => {
      const m = String(nome).match(/\.(\d+)\./);
      return m ? Number(m[1]) : "?";
    };

    const payload = salas.map((nome) => ({
      sala: String(nome),
      piso: parsePiso(nome),
      lugares: CAP_BASE,
    }));

    return res.json(payload);
  } catch (err) {
    console.error("❌ Erro /api/salas:", err);
    return res.status(500).json({ success: false, message: "Erro no servidor" });
  }
});

app.get("/api/salas/:sala/status", async (req, res) => {
  try {
    const { sala } = req.params;
    const { dia, hora } = req.query;

    if (!sala || !dia || !hora) {
      return res.status(400).json({ success: false, message: "Falta sala/dia/hora." });
    }

    if (isWeekend(dia)) {
      return res.json({
        success: true,
        bloqueado: true,
        motivo: "fim-de-semana",
        status: "Indisponível",
        lugaresDisponiveis: 0,
        mudaEm: null,
      });
    }

    if (isFeriado(dia)) {
      return res.json({
        success: true,
        bloqueado: true,
        motivo: "feriado",
        status: "Indisponível",
        lugaresDisponiveis: 0,
        mudaEm: null,
      });
    }

    const hNow = toMinutes(hora);
    if (Number.isNaN(hNow)) {
      return res.status(400).json({ success: false, message: "Hora inválida." });
    }

    const aulasDia = await Ocupacao.find({ sala, dia });

    const aulaAgora = aulasDia.find((a) => {
      const ini = toMinutes(a.hora_inicio);
      const fim = toMinutes(a.hora_fim);
      return hNow >= ini && hNow < fim;
    });

    if (aulaAgora) {
      return res.json({
        success: true,
        bloqueado: false,
        status: "Ocupada",
        lugaresDisponiveis: 0,
        mudaEm: aulaAgora.hora_fim,
        causa: "aula",
      });
    }

    const reservasDia = await Reserva.find({ sala, dia, status: "ativa" });

    let consumoAgora = 0;
    for (const r of reservasDia) {
      const ini = toMinutes(r.hora_inicio);
      const fim = toMinutes(r.hora_fim);
      if (hNow >= ini && hNow < fim) {
        const p = r.pessoas ?? 1;
        consumoAgora += consumoReserva(p);
      }
    }

    const livresAgora = Math.max(0, CAP_BASE - consumoAgora);
    const statusAgora = livresAgora > 0 ? "Livre" : "Ocupada";

    const pontos = new Set();
    for (const a of aulasDia) {
      pontos.add(a.hora_inicio);
      pontos.add(a.hora_fim);
    }
    for (const r of reservasDia) {
      pontos.add(r.hora_inicio);
      pontos.add(r.hora_fim);
    }

    const pontosOrdenados = Array.from(pontos)
      .map((t) => ({ t, m: toMinutes(t) }))
      .filter((x) => Number.isFinite(x.m))
      .sort((a, b) => a.m - b.m);

    const avaliar = async (tMin) => {
      const aula = aulasDia.find((a) => {
        const ini = toMinutes(a.hora_inicio);
        const fim = toMinutes(a.hora_fim);
        return tMin >= ini && tMin < fim;
      });
      if (aula) return { status: "Ocupada", livres: 0 };

      let consumo = 0;
      for (const r of reservasDia) {
        const ini = toMinutes(r.hora_inicio);
        const fim = toMinutes(r.hora_fim);
        if (tMin >= ini && tMin < fim) {
          const p = r.pessoas ?? 1;
          consumo += consumoReserva(p);
        }
      }
      const livres = Math.max(0, CAP_BASE - consumo);
      return { status: livres > 0 ? "Livre" : "Ocupada", livres };
    };

    let mudaEm = null;
    for (const p of pontosOrdenados) {
      if (p.m <= hNow) continue;
      const st = await avaliar(p.m);
      if (st.status !== statusAgora) {
        mudaEm = p.t;
        break;
      }
    }

    return res.json({
      success: true,
      bloqueado: false,
      status: statusAgora,
      lugaresDisponiveis: livresAgora,
      mudaEm,
      causa: "reservas",
    });
  } catch (err) {
    console.error("❌ Erro /api/salas/:sala/status:", err);
    return res.status(500).json({ success: false, message: "Erro no servidor" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor a correr na porta ${PORT}`));
