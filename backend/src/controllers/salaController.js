const Ocupacao = require("../models/OcupacaoRaw");
const Reserva = require("../models/Reserva");
const FERIADOS = require("../config/feriadosPT");

const CAP_BASE = 15;

// --- Helpers Locais ---
const isWeekend = (isoDate) => {
  const d = new Date(`${isoDate}T00:00:00`);
  const day = d.getDay();
  return day === 0 || day === 6;
};

const isFeriado = (isoDate) => FERIADOS.has(isoDate);

const toMinutes = (t) => {
  const [h, m] = String(t).split(":").map(Number);
  return h * 60 + m;
};

// ✅ CORRIGIDO AQUI TAMBÉM: Sem penalidade!
const consumoReserva = (pessoas) => {
  return Number(pessoas) || 1;
};

// --- Controllers ---

exports.getFeriados = (req, res) => {
  res.json({ success: true, feriados: Array.from(FERIADOS) });
};

exports.getSalasLivres = async (req, res) => {
  try {
    const { dia, hora } = req.query;

    if (!dia || !hora) return res.status(400).json({ error: "Falta dados (dia/hora)." });

    if (isWeekend(dia) || isFeriado(dia)) {
      return res.json([]);
    }

    // Lista base de salas (podes expandir isto ou buscar de uma coleção Sala se criares no futuro)
    let dbSalas = [{ nome: "S.1.1", piso: 1, lugares: CAP_BASE }];

    // Descobrir todas as salas conhecidas na coleção de Ocupação
    const todasSalasNaBD = await Ocupacao.distinct("sala");
    todasSalasNaBD.forEach((nomeDaSala) => {
      if (!dbSalas.find((s) => s.nome === nomeDaSala)) {
        let pisoAdivinhado = "?";
        const partes = nomeDaSala.split(".");
        if (partes.length >= 2 && !isNaN(partes[1])) pisoAdivinhado = partes[1];
        dbSalas.push({ nome: nomeDaSala, piso: pisoAdivinhado, lugares: CAP_BASE });
      }
    });

    // 1. Salas ocupadas por AULAS no horário pedido
    const ocupadasAula = await Ocupacao.find({
      dia,
      hora_inicio: { $lte: hora },
      hora_fim: { $gt: hora },
    }).distinct("sala");

    // 2. Reservas para esse dia
    const reservasDia = await Reserva.find({ dia, status: "ativa" });

    // Calcular consumo de capacidade por sala
    const consumoPorSala = {};
    const hNow = toMinutes(hora);

    for (const r of reservasDia) {
      const ini = toMinutes(r.hora_inicio);
      const fim = toMinutes(r.hora_fim);

      if (hNow >= ini && hNow < fim) {
        const p = r.pessoas ?? 1;
        consumoPorSala[r.sala] = (consumoPorSala[r.sala] || 0) + consumoReserva(p);
      }
    }

    // Construir resposta
    const resultado = dbSalas.map((s) => {
      const salaNome = s.nome;

      // Se tem aula, está totalmente ocupada
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
    console.error("❌ Erro getSalasLivres:", err);
    res.status(500).json({ error: "Erro ao buscar salas livres." });
  }
};

exports.getAllSalas = async (req, res) => {
  try {
    const salasOcup = await Ocupacao.distinct("sala");
    const salasRes = await Reserva.distinct("sala");

    // Unir listas e remover duplicados
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
};

exports.getSalaStatus = async (req, res) => {
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

    // --- 1. Verificar Aulas ---
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

    // --- 2. Verificar Reservas ---
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

    // --- 3. Calcular "mudaEm" (Timeline) ---
    // Recolher todos os pontos de mudança (início e fim de aulas e reservas)
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

    // Função interna para simular o estado em qualquer minuto futuro
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
    // Procurar no futuro quando é que o status muda
    for (const p of pontosOrdenados) {
      if (p.m <= hNow) continue; // ignorar passado
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
};