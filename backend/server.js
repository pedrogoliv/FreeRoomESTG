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

const UserSchema = new mongoose.Schema(
  {
    curso: { type: String, required: true },

    numero: { type: String, required: true, unique: true, trim: true },

    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // Em produção: bcrypt
    favoritos: { type: [String], default: [] },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

// ---  LIGAÇÃO À BD ---
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

    const existeCurso = await Curso.exists({ nome: curso });
    if (!existeCurso) {
      return res.status(400).json({ success: false, message: "Curso inválido." });
    }

    const numeroNorm = String(numero).trim();
    if (!/^\d+$/.test(numeroNorm)) {
      return res.status(400).json({ success: false, message: "Número inválido (apenas dígitos)." });
    }

    const usernameTrim = String(username).trim();
    const emailNorm = String(email).trim().toLowerCase();

    const existingUser = await User.findOne({ username: usernameTrim });
    if (existingUser) return res.status(400).json({ success: false, message: "Username já existe." });

    const existingEmail = await User.findOne({ email: emailNorm });
    if (existingEmail) return res.status(400).json({ success: false, message: "Email já existe." });

    const existingNumero = await User.findOne({ numero: numeroNorm });
    if (existingNumero)
      return res.status(400).json({ success: false, message: "Esse número já está registado." });

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

app.post("/auth/registar", registarHandler);
app.post("/auth/register", registarHandler);

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
app.put("/api/users/:username", async (req, res) => {
  try {
    const { curso, email, numero } = req.body;

    const updates = {};

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

    if (email !== undefined) {
      const emailNorm = String(email).trim().toLowerCase();
      if (!emailNorm) {
        return res.status(400).json({ success: false, message: "Email inválido." });
      }

      const exists = await User.findOne({
        email: emailNorm,
        username: { $ne: req.params.username },
      });
      if (exists) {
        return res.status(400).json({ success: false, message: "Email já está a ser usado." });
      }

      updates.email = emailNorm;
    }

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


app.put("/api/users/:username", async (req, res) => {
  try {
    const { curso, email, numero } = req.body;

    // ---- CURSO (se vier no body, valida se existe) ----
    if (curso !== undefined) {
      const cursoNorm = String(curso).trim();
      if (!cursoNorm) {
        return res
          .status(400)
          .json({ success: false, message: "Curso é obrigatório." });
      }

      const existeCurso = await Curso.exists({ nome: cursoNorm });
      if (!existeCurso) {
        return res
          .status(400)
          .json({ success: false, message: "Curso inválido." });
      }
    }

    // ---- EMAIL (opcional) ----
    let emailUpdate = undefined;
    if (email !== undefined) {
      const emailNorm = String(email).trim().toLowerCase();
      if (!emailNorm) {
        return res
          .status(400)
          .json({ success: false, message: "Email inválido." });
      }

      const exists = await User.findOne({
        email: emailNorm,
        username: { $ne: req.params.username },
      });

      if (exists) {
        return res
          .status(400)
          .json({ success: false, message: "Email já está a ser usado." });
      }

      emailUpdate = emailNorm;
    }

    // ---- NUMERO (pode ser null/"" para limpar) ----
    let numeroUpdate = undefined;

    if (numero !== undefined) {
      // permitir limpar
      if (numero === null || String(numero).trim() === "") {
        numeroUpdate = null;
      } else {
        const numeroNorm = String(numero).trim();

        if (!/^\d+$/.test(numeroNorm)) {
          return res.status(400).json({
            success: false,
            message: "Número inválido (apenas dígitos).",
          });
        }

        const existsNumero = await User.findOne({
          numero: numeroNorm,
          username: { $ne: req.params.username },
        });

        if (existsNumero) {
          return res.status(400).json({
            success: false,
            message: "Esse número já está registado.",
          });
        }

        numeroUpdate = numeroNorm;
      }
    }

    const updated = await User.findOneAndUpdate(
      { username: req.params.username },
      {
        ...(curso !== undefined ? { curso: String(curso).trim() } : {}),
        ...(email !== undefined ? { email: emailUpdate } : {}),
        ...(numero !== undefined ? { numero: numeroUpdate } : {}),
      },
      { new: true }
    ).select("-password");

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "User não encontrado" });
    }

    return res.json({ success: true, user: updated });
  } catch (err) {
    console.error("❌ Erro ao atualizar user:", err);
    return res
      .status(500)
      .json({ success: false, message: "Erro no servidor" });
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

app.get("/api/feriados", (req, res) => {
  res.json({ success: true, feriados: Array.from(FERIADOS) });
});

const toMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

// capacidade base (10–15 -> sugestão do prof)
const CAP_BASE = 15;

// grupos maiores gastam mais “capacidade”
function consumoReserva(pessoas) {
  const p = Number(pessoas) || 1;
  const penalty = Math.floor((p - 1) / 3); // 1-3=>0, 4-6=>1, 7-9=>2...
  return p + penalty;
}

app.post("/api/reservar", async (req, res) => {
  try {
    const { sala, dia, hora_inicio, hora_fim, pessoas } = req.body;

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

    // valida pessoas (default 1)
    const nPessoas = Number(pessoas ?? 1);
    if (!Number.isInteger(nPessoas) || nPessoas < 1) {
      return res.status(400).json({ erro: "Campo 'pessoas' inválido." });
    }

    // AULAS BLOQUEIAM SEMPRE
    const aulas = await Ocupacao.find({ sala, dia });
    const aulaConflito = aulas.some((a) => {
      const ini = toMinutes(a.hora_inicio);
      const fim = toMinutes(a.hora_fim);
      return novoIni < fim && novoFim > ini;
    });

    if (aulaConflito) {
      return res.status(409).json({ erro: "Sala tem aula nesse horário." });
    }

    // RESERVAS EXISTENTES (permitir sobreposição até ao limite)
    const reservas = await Reserva.find({ sala, dia });

    const reservasOverlap = reservas.filter((r) => {
      const ini = toMinutes(r.hora_inicio);
      const fim = toMinutes(r.hora_fim);
      return novoIni < fim && novoFim > ini;
    });

    const consumoOcupado = reservasOverlap.reduce((sum, r) => {
      const p = r.pessoas ?? 1; // reservas antigas sem 'pessoas' contam como 1
      return sum + consumoReserva(p);
    }, 0);

    const consumoNovo = consumoReserva(nPessoas);
    const sobra = CAP_BASE - consumoOcupado;

    if (consumoNovo > sobra) {
      return res.status(409).json({
        erro: `Capacidade excedida. Espaço disponível (com regra de grupos): ${Math.max(0, sobra)}.`,
      });
    }

    // Criar reserva (guarda pessoas)
    const novaReserva = await Reserva.create({
      ...req.body,
      pessoas: nPessoas,
    });

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

    // capacidade base em vez de 30
    let dbSalas = [{ nome: "S.1.1", piso: 1, lugares: CAP_BASE }];

    // adicionar salas descobertas na BD
    const todasSalasNaBD = await Ocupacao.distinct("sala");
    todasSalasNaBD.forEach((nomeDaSala) => {
      if (!dbSalas.find((s) => s.nome === nomeDaSala)) {
        let pisoAdivinhado = "?";
        const partes = nomeDaSala.split(".");
        if (partes.length >= 2 && !isNaN(partes[1])) pisoAdivinhado = partes[1];

        dbSalas.push({ nome: nomeDaSala, piso: pisoAdivinhado, lugares: CAP_BASE });
      }
    });

    // salas com aulas nessa hora (bloqueia)
    const ocupadasAula = await Ocupacao.find({
      dia,
      hora_inicio: { $lte: hora },
      hora_fim: { $gt: hora },
    }).distinct("sala");

    // reservas do dia (filtrar em JS pelo intervalo)
    const reservasDia = await Reserva.find({ dia });

    // consumo por sala nessa hora
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
        return {
          ...s,
          sala: salaNome,
          status: "Ocupada",
          lugaresDisponiveis: 0,
        };
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

// ==========================================
//            LISTA FIXA DE SALAS (METADADOS)
// ==========================================
app.get("/api/salas", async (req, res) => {
  try {
    const salasOcup = await Ocupacao.distinct("sala");
    const salasRes = await Reserva.distinct("sala");

    const salas = Array.from(new Set([...salasOcup, ...salasRes]))
      .filter(Boolean)
      .sort((a, b) => String(a).localeCompare(String(b)));

    const parsePiso = (nome) => {
      const m = String(nome).match(/\.(\d+)\./); // A.2.1 -> 2
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

// ==========================================
//     STATUS DE UMA SALA (livre até / fica livre em)
// ==========================================
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

    // --- 1) Aulas (bloqueiam sempre) ---
    const aulasDia = await Ocupacao.find({ sala, dia });

    const aulaAgora = aulasDia.find((a) => {
      const ini = toMinutes(a.hora_inicio);
      const fim = toMinutes(a.hora_fim);
      return hNow >= ini && hNow < fim;
    });

    if (aulaAgora) {
      // enquanto houver aula, sala está ocupada até hora_fim da aula
      return res.json({
        success: true,
        bloqueado: false,
        status: "Ocupada",
        lugaresDisponiveis: 0,
        mudaEm: aulaAgora.hora_fim, // quando "muda" para livre (se não houver reservas a seguir)
        causa: "aula",
      });
    }

    // --- 2) Reservas (ocupam por capacidade) ---
    const reservasDia = await Reserva.find({ sala, dia });

    // consumo agora
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

    // calcular "mudaEm" (próxima mudança de estado) ---
    // candidatos a momentos de mudança = inícios/fins de reservas e inícios/fins de aulas
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

    // função para avaliar estado numa hora "t"
    const avaliar = async (tMin) => {
      // aula bloqueia
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
      mudaEm, // pode ser null se não mudar mais nesse dia
      causa: "reservas",
    });
  } catch (err) {
    console.error("❌ Erro /api/salas/:sala/status:", err);
    return res.status(500).json({ success: false, message: "Erro no servidor" });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor a correr na porta ${PORT}`));
