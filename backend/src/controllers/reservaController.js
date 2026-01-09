const Reserva = require("../models/Reserva");
const Ocupacao = require("../models/OcupacaoRaw");
const FERIADOS = require("../config/feriadosPT"); // Assuming you move config here

const CAP_BASE = 15;

// --- Helpers ---
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
  const p = Number(pessoas) || 1;
  const penalty = Math.floor((p - 1) / 3);
  return p + penalty;
};
const isValidTimeHHMM = (t) => typeof t === "string" && /^\d{2}:\d{2}$/.test(t);
const addMinutesHHMM = (hhmm, minutesToAdd) => {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + minutesToAdd;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
};

// --- Handlers ---

exports.criarReserva = async (req, res) => {
  try {
    const { sala, dia, hora_inicio, hora_fim, pessoas, responsavel, motivo } = req.body;

    if (!sala || !dia || !hora_inicio || !hora_fim) {
      return res.status(400).json({ erro: "Faltam campos obrigatórios." });
    }
    if (!responsavel || String(responsavel).trim() === "") {
      return res.status(400).json({ erro: "Falta o responsável." });
    }
    if (isWeekend(dia)) {
      return res.status(400).json({ erro: "Fim-de-semana bloqueado." });
    }
    if (isFeriado(dia)) {
      return res.status(400).json({ erro: "Feriado bloqueado." });
    }

    const novoIni = toMinutes(hora_inicio);
    const novoFim = toMinutes(hora_fim);
    if (Number.isNaN(novoIni) || Number.isNaN(novoFim)) {
      return res.status(400).json({ erro: "Hora inválida." });
    }
    if (novoFim <= novoIni) {
      return res.status(400).json({ erro: "Hora fim deve ser maior que início." });
    }

    const nPessoas = Number(pessoas ?? 1);
    if (!Number.isInteger(nPessoas) || nPessoas < 1) {
      return res.status(400).json({ erro: "Pessoas inválido." });
    }

    // Conflict Checks
    const aulas = await Ocupacao.find({ sala, dia });
    const aulaConflito = aulas.some((a) => {
      const ini = toMinutes(a.hora_inicio);
      const fim = toMinutes(a.hora_fim);
      return novoIni < fim && novoFim > ini;
    });
    if (aulaConflito) {
      return res.status(409).json({ erro: "Sala tem aula nesse horário." });
    }

    const reservas = await Reserva.find({ sala, dia, status: "ativa" });
    const reservasOverlap = reservas.filter((r) => {
      const ini = toMinutes(r.hora_inicio);
      const fim = toMinutes(r.hora_fim);
      return novoIni < fim && novoFim > ini;
    });

    const consumoOcupado = reservasOverlap.reduce((sum, r) => sum + consumoReserva(r.pessoas ?? 1), 0);
    const consumoNovo = consumoReserva(nPessoas);
    const sobra = CAP_BASE - consumoOcupado;

    if (consumoNovo > sobra) {
      return res.status(409).json({ erro: `Capacidade excedida. Disponível: ${Math.max(0, sobra)}.` });
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
    console.error("❌ Erro reserva:", err);
    return res.status(500).json({ erro: "Erro no servidor: " + err.message });
  }
};

exports.getHistorico = async (req, res) => {
  try {
    const { username } = req.params;
    const limit = Math.min(Number(req.query.limit || 20), 100);
    const reservas = await Reserva.find({ responsavel: username }).sort({ createdAt: -1 }).limit(limit);
    return res.json({ success: true, reservas });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Erro no servidor" });
  }
};

exports.getReservasUser = async (req, res) => {
  try {
    const { username } = req.params;
    const reservas = await Reserva.find({ responsavel: username, status: { $ne: "cancelada" } }).sort({ dia: 1, hora_inicio: 1 });
    return res.json({ success: true, reservas });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Erro no servidor" });
  }
};

exports.updateReserva = async (req, res) => {
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
};

exports.deleteReserva = async (req, res) => {
  try {
    const { reservaId } = req.params;
    const reserva = await Reserva.findById(reservaId);
    if (!reserva) {
      return res.status(404).json({ success: false, message: "Não encontrada." });
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
};