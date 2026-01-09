const User = require("../models/User");
const Reserva = require("../models/Reserva");
const Curso = require("../models/Curso");

exports.getUser = async (req, res) => {
  try {
    const u = await User.findOne({ username: req.params.username }).select("-password");
    if (!u) return res.status(404).json({ success: false, message: "User não encontrado" });
    return res.json({ success: true, user: u });
  } catch (err) {
    console.error("❌ Erro GET user:", err);
    return res.status(500).json({ success: false, message: "Erro no servidor" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { curso, numero } = req.body;
    const updates = {};

    if (curso !== undefined) {
      const cursoNorm = String(curso).trim();
      if (!cursoNorm) return res.status(400).json({ success: false, message: "Curso é obrigatório." });
      
      const existeCurso = await Curso.exists({ nome: cursoNorm });
      if (!existeCurso) return res.status(400).json({ success: false, message: "Curso inválido." });
      
      updates.curso = cursoNorm;
    }

    if (numero !== undefined) {
      if (numero === null || String(numero).trim() === "") {
        updates.numero = null;
      } else {
        const numeroNorm = String(numero).trim();
        if (!/^\d+$/.test(numeroNorm)) return res.status(400).json({ success: false, message: "Número inválido." });

        const existsNumero = await User.findOne({
          numero: numeroNorm,
          username: { $ne: req.params.username },
        });
        if (existsNumero) return res.status(400).json({ success: false, message: "Esse número já está registado." });

        updates.numero = numeroNorm;
      }
    }

    const updated = await User.findOneAndUpdate({ username: req.params.username }, updates, { new: true }).select("-password");
    if (!updated) return res.status(404).json({ success: false, message: "User não encontrado" });

    return res.json({ success: true, user: updated });
  } catch (err) {
    console.error("❌ Erro ao atualizar user:", err);
    return res.status(500).json({ success: false, message: "Erro no servidor" });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const { username } = req.params;
    
    // 1. Buscar reservas ativas
    const todasReservas = await Reserva.find({ responsavel: username, status: { $ne: "cancelada" } });
    const agora = new Date();

    // 2. Filtro: Apenas reservas PASSADAS
    const reservasPassadas = todasReservas.filter((r) => {
      if (!r.dia || !r.hora_fim) return false;
      const diaStr = String(r.dia).split("T")[0]; 
      const horaFimStr = String(r.hora_fim);
      const dataFimReserva = new Date(`${diaStr}T${horaFimStr}:00`);
      return dataFimReserva < agora;
    });

    const totalReservas = reservasPassadas.length;
    
    // Helper minutos
    const toMinutesLocal = (t) => {
      const [h, m] = String(t).split(":").map(Number);
      return h * 60 + m;
    };

    let totalMin = 0;
    const salaCount = {};

    for (const r of reservasPassadas) {
      // Soma horas
      if (r?.hora_inicio && r?.hora_fim) {
        const diff = toMinutesLocal(r.hora_fim) - toMinutesLocal(r.hora_inicio);
        if (diff > 0) totalMin += diff;
      }
      // Contagem Salas
      const sala = String(r.sala || "");
      if (sala) salaCount[sala] = (salaCount[sala] || 0) + 1;
    }

    const totalHoras = Math.round((totalMin / 60) * 10) / 10;
    
    // --- Lógica Sala Mais Usada (Só mostra se houver > 1 reserva) ---
    const salasOrdenadas = Object.entries(salaCount).sort((a, b) => b[1] - a[1]);
    let salaTop = "---";

    if (salasOrdenadas.length > 0) {
      const [nomeSala, qtdReservas] = salasOrdenadas[0];
      // Só define como "Top" se tiver mais do que 1 reserva na mesma sala
      // (E podes adicionar "&& totalReservas > 1" para garantir que tens várias reservas no total)
      if (qtdReservas > 1) {
        salaTop = nomeSala;
      }
      // Caso tenhas 2 reservas mas em salas diferentes (1 cada), qtdReservas será 1, logo fica "---"
    }
    
    return res.json({ success: true, stats: { totalReservas, totalHoras, salaTop } });

  } catch (err) {
    console.error("❌ Erro stats:", err);
    return res.status(500).json({ success: false, message: "Erro no servidor" });
  }
};

exports.getFavoritos = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    res.json(user ? user.favoritos : []);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar favoritos" });
  }
};

exports.toggleFavorito = async (req, res) => {
  const { username, salaId } = req.body;
  if (!username || !salaId) return res.status(400).json({ success: false, message: "Faltam dados." });

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
};