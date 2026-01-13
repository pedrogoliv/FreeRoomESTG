const Ocupacao = require("../models/OcupacaoRaw");
const Reserva = require("../models/Reserva");
const FERIADOS = require("../config/feriadosPT");

// capacidade por prefixo da sala: A=25, S=20, L=15
const capacidadePorSala = (nome = "") => {
  const s = String(nome).trim().toUpperCase();
  const clean = s.replace(/\s+/g, "").replace(/^\.+/, ""); // remove espaços e pontos no início
  const prefix = clean[0];

  if (prefix === "A") return 25;
  if (prefix === "S") return 20;
  if (prefix === "L") return 15;
  return 15;
};

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

const consumoReserva = (pessoas) => {
  return Number(pessoas) || 1;
};

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

    // seed mínimo (podes remover se quiseres, mas deixei como tinhas)
    let dbSalas = [{ nome: "S.1.1", piso: 1, lugares: capacidadePorSala("S.1.1") }];

    const todasSalasNaBD = await Ocupacao.distinct("sala");
    todasSalasNaBD.forEach((nomeDaSala) => {
      if (!dbSalas.find((s) => s.nome === nomeDaSala)) {
        let pisoAdivinhado = "?";
        const partes = String(nomeDaSala).split(".");
        if (partes.length >= 2 && !isNaN(partes[1])) pisoAdivinhado = partes[1];

        dbSalas.push({
          nome: nomeDaSala,
          piso: pisoAdivinhado,
          lugares: capacidadePorSala(nomeDaSala),
        });
      }
    });

    const ocupadasAula = await Ocupacao.find({
      dia,
      hora_inicio: { $lte: hora },
      hora_fim: { $gt: hora },
    }).distinct("sala");

    const reservasDia = await Reserva.find({ dia, status: "ativa" });

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

    const resultado = dbSalas.map((s) => {
      const salaNome = s.nome;
      const cap = capacidadePorSala(salaNome);

      if (ocupadasAula.includes(salaNome)) {
        return { ...s, sala: salaNome, lugares: cap, status: "Ocupada", lugaresDisponiveis: 0 };
      }

      const consumo = consumoPorSala[salaNome] || 0;
      const livres = Math.max(0, cap - consumo);

      return {
        ...s,
        sala: salaNome,
        lugares: cap,
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
      lugares: capacidadePorSala(nome),
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

    const capSala = capacidadePorSala(sala);

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

    const livresAgora = Math.max(0, capSala - consumoAgora);
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

      const livres = Math.max(0, capSala - consumo);
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
};
