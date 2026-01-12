const Reserva = require("../models/Reserva");
const Ocupacao = require("../models/OcupacaoRaw");
const FERIADOS = require("../config/feriadosPT");

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
  return Number(pessoas) || 1;
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
      return res.status(409).json({ erro: "A sala está ocupada nesse horário." });
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
    

    const { 
      dia, 
      hora_inicio, 
      hora_fim, // Agora lemos explicitamente a hora de fim
      pessoas, 
      motivo 
    } = req.body;

    // 2. Buscar a reserva original
    const reserva = await Reserva.findById(reservaId);
    if (!reserva) {
      return res.status(404).json({ success: false, message: "Reserva não encontrada." });
    }
    if (reserva.status === "cancelada") {
      return res.status(400).json({ success: false, message: "Não podes editar uma reserva cancelada." });
    }

    // 3. Definir os novos valores (ou manter os antigos se não vierem no pedido)
    // IMPORTANTE: Usamos 'let' para poder alterar conforme a lógica
    let novoDia = dia !== undefined ? String(dia).trim() : reserva.dia;
    let novoIni = hora_inicio !== undefined ? String(hora_inicio).trim() : reserva.hora_inicio;
    let novoFim = hora_fim !== undefined ? String(hora_fim).trim() : reserva.hora_fim;
    
    // Atualizar dados simples
    if (motivo !== undefined) reserva.motivo = String(motivo).trim();
    if (pessoas !== undefined) reserva.pessoas = Number(pessoas);

    // 4. Se houver mudança de horário, validar TUDO
    const mudouHorario = (novoDia !== reserva.dia) || (novoIni !== reserva.hora_inicio) || (novoFim !== reserva.hora_fim);

    if (mudouHorario) {

      // A. Validações Básicas
      if (isWeekend(novoDia)) return res.status(400).json({ success: false, message: "Fim-de-semana bloqueado." });
      if (isFeriado(novoDia)) return res.status(400).json({ success: false, message: "Feriado bloqueado." });

      const minIni = toMinutes(novoIni);
      const minFim = toMinutes(novoFim);

      if (Number.isNaN(minIni) || Number.isNaN(minFim)) {
        return res.status(400).json({ success: false, message: "Formato de hora inválido." });
      }
      if (minFim <= minIni) {
        return res.status(400).json({ success: false, message: "A hora de fim deve ser depois do início." });
      }

      // B. Verificar Conflitos com AULAS (Ocupacao)
      const aulas = await Ocupacao.find({ sala: reserva.sala, dia: novoDia });
      const conflitoAula = aulas.some((a) => {
        const aIni = toMinutes(a.hora_inicio);
        const aFim = toMinutes(a.hora_fim);
        return minIni < aFim && minFim > aIni;
      });
      if (conflitoAula) {
        return res.status(409).json({ success: false, message: "Existe uma aula nesse horário." });
      }

      // C. Verificar Conflitos com OUTRAS RESERVAS
      const outrasReservas = await Reserva.find({
        _id: { $ne: reserva._id }, // Ignora a própria reserva que estamos a editar
        sala: reserva.sala,
        dia: novoDia,
        status: "ativa"
      });

      const overlap = outrasReservas.filter((r) => {
        const rIni = toMinutes(r.hora_inicio);
        const rFim = toMinutes(r.hora_fim);
        return minIni < rFim && minFim > rIni;
      });

      // Calcular Capacidade
      const ocupado = overlap.reduce((sum, r) => sum + (r.pessoas || 1), 0);
      const capacidadeRestante = CAP_BASE - ocupado;
      const minhasPessoas = reserva.pessoas || 1; // Já atualizámos o reserva.pessoas ali em cima

      if (minhasPessoas > capacidadeRestante) {
        return res.status(409).json({ 
          success: false, 
          message: `Sala cheia nesse horário. Lugares livres: ${Math.max(0, capacidadeRestante)}.` 
        });
      }

      // D. Se passou todas as validações, aplica as novas horas
      reserva.dia = novoDia;
      reserva.hora_inicio = novoIni;
      reserva.hora_fim = novoFim;
    }

    // 5. Guardar na Base de Dados
    await reserva.save();
    
    return res.json({ success: true, reserva });

  } catch (err) {
    console.error("❌ Erro critico no updateReserva:", err);
    return res.status(500).json({ success: false, message: "Erro interno do servidor." });
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