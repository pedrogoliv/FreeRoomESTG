import { useState, useEffect, useMemo } from "react";
import "./gerirReserva.css";
import {
  FaTimes,
  FaTrash,
  FaSave,
  FaMapMarkedAlt,
  FaChevronRight,
  FaExclamationTriangle,
  FaStopCircle
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";

export default function GerirReserva({
  salaInfo,
  reserva,
  user,
  onClose,
  onSuccess
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const dadosSalvos = salaInfo?.estadoPreservado || {};

  const [dia, setDia] = useState(dadosSalvos.dia || reserva.dia);
  const [horaInicio, setHoraInicio] = useState(dadosSalvos.horaInicio || reserva.hora_inicio);
  const [horaFim, setHoraFim] = useState(dadosSalvos.horaFim || reserva.hora_fim);
  const [pessoas, setPessoas] = useState(dadosSalvos.pessoas || reserva.pessoas);
  const [motivo, setMotivo] = useState(dadosSalvos.motivo || reserva.motivo || "");

  const [showConfirm, setShowConfirm] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // -------- helpers de data/hora --------
  const now = new Date();
  const hojeISO = now.toISOString().split("T")[0];

  const pad2 = (n) => String(n).padStart(2, "0");

  // arredonda para o slot atual (00 ou 30) para ficar consistente com o teu sistema
  const agoraSlotStr = useMemo(() => {
    const h = now.getHours();
    const m = now.getMinutes();
    const mm = m < 30 ? "00" : "30";
    return `${pad2(h)}:${mm}`;
  }, []); // só precisa do valor no momento de abrir o modal

  const isDecorrer = (dia === hojeISO && horaInicio <= agoraSlotStr && horaFim > agoraSlotStr);

  const horarios = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 23; h++) {
      const hh = pad2(h);
      slots.push(`${hh}:00`);
      if (h < 23) slots.push(`${hh}:30`);
    }
    return slots;
  }, []);

  const horariosInicioDisponiveis = useMemo(() => {
    return horarios.filter((h) => {
      if (h === "23:00") return false;

      // se for hoje e não estiver a decorrer, bloqueia inícios no passado (mas mantém o original)
      if (dia === hojeISO && !isDecorrer) {
        return h >= agoraSlotStr || h === reserva.hora_inicio || h === horaInicio;
      }
      return true;
    });
  }, [horarios, dia, hojeISO, isDecorrer, agoraSlotStr, reserva.hora_inicio, horaInicio]);

  const horariosFimDisponiveis = useMemo(() => horarios.filter((h) => h > horaInicio), [horarios, horaInicio]);

  // garantir que a hora de fim nunca fica inválida
  useEffect(() => {
    if (!horaFim || horaFim <= horaInicio) {
      const idx = horarios.indexOf(horaInicio);
      if (idx !== -1 && idx < horarios.length - 1) setHoraFim(horarios[idx + 1]);
    }
  }, [horaInicio, horaFim, horarios]);

  const handleChangeInicio = (e) => {
    const novoInicio = e.target.value;
    setHoraInicio(novoInicio);

    if (horaFim <= novoInicio) {
      const index = horarios.indexOf(novoInicio);
      if (index !== -1 && index < horarios.length - 1) {
        setHoraFim(horarios[index + 1]);
      }
    }
  };

  // atualizar reserva
  const handleAtualizar = async () => {
    setLoading(true);
    setMsg("");

    const dadosParaEnviar = {
      dia,
      hora_inicio: horaInicio,
      hora_fim: horaFim,
      pessoas: Number(pessoas),
      responsavel: user?.username,
      motivo
    };

    try {
      const res = await fetch(`${API_BASE}/api/reservas/${reserva._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosParaEnviar)
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && (data.success === undefined || data.success === true)) {
        onSuccess?.();
      } else {
        setMsg(data.message || data.erro || "Erro ao atualizar.");
      }
    } catch (error) {
      setMsg("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

   const handleTerminarAgora = async () => {
  setLoading(true);
  setMsg("");

  const t = new Date();
  const pad2 = (n) => String(n).padStart(2, "0");
  
  // Calcula hora atual HH:MM
  let novoFim = `${pad2(t.getHours())}:${pad2(t.getMinutes())}`;

  // --- CORREÇÃO AQUI ---
  // Se a hora atual for menor ou IGUAL ao início, isso gera erro no backend.
  // Forçamos o fim para ser, no mínimo, 1 minuto depois do início.
  if (novoFim <= reserva.hora_inicio) {
    // Vamos buscar os componentes da hora de início (ex: "14:30")
    const [h, m] = reserva.hora_inicio.split(':').map(Number);
    const dataAjustada = new Date();
    dataAjustada.setHours(h);
    dataAjustada.setMinutes(m + 1); // Adiciona 1 minuto ao início
    
    novoFim = `${pad2(dataAjustada.getHours())}:${pad2(dataAjustada.getMinutes())}`;
  }

  // Segurança: nunca acima do fim original (para não estender a reserva sem querer)
  if (novoFim > reserva.hora_fim) novoFim = reserva.hora_fim;

  const dadosParaEnviar = {
    dia: reserva.dia,
    hora_inicio: reserva.hora_inicio,
    hora_fim: novoFim,
    pessoas: reserva.pessoas,
    responsavel: user.username,
    motivo: reserva.motivo,
    status: "terminada", // Apenas se o teu backend aceitar mudança direta de status
  };

  try {
    const res = await fetch(`${API_BASE}/api/reservas/${reserva._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dadosParaEnviar),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && (data.success === undefined || data.success === true)) {
      if (onSuccess) onSuccess();
    } else {
      setMsg(data.message || data.erro || "Erro ao terminar reserva.");
    }
  } catch (e) {
    setMsg("Erro de conexão.");
  } finally {
    setLoading(false);
  }
};


  // -------- cancelar --------
  const handlePreCancelar = () => setShowConfirm(true);

  const handleConfirmarCancelamento = async () => {
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch(`${API_BASE}/api/reservas/${reserva._id}`, { method: "DELETE" });
      if (res.ok) {
        onSuccess?.();
      } else {
        setMsg("Erro ao cancelar.");
      }
    } catch (e) {
      setMsg("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerMapa = () => {
    navigate("/mapa", {
      state: {
        pisoDestino: salaInfo.piso,
        salaDestino: salaInfo.sala,
        origem: "reserva",
        from: location.pathname + location.search,
        estadoPreservado: { dia, horaInicio, horaFim, pessoas, motivo }
      }
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title-group">
            <h2>{isDecorrer ? "Reserva em Curso" : "Gerir Reserva"}</h2>
          </div>
          <button className="btn-close" onClick={onClose} type="button">
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          {msg && <div className="msg-error">{msg}</div>}

          <div className="form-grid-compact">
            <div className="form-group">
              <label className="field-label">Dia</label>
              <input
                type="date"
                className="field-control"
                value={dia}
                onChange={(e) => setDia(e.target.value)}
                min={hojeISO}
                disabled={isDecorrer}
              />
            </div>

            <div className="form-group">
              <label className="field-label">Pessoas</label>
              <input
                type="number"
                className="field-control"
                min="1"
                max={salaInfo.lugares}
                value={pessoas}
                onChange={(e) => setPessoas(e.target.value)}
                disabled={isDecorrer}
              />
            </div>

            <div className="form-group">
              <label className="field-label">Início</label>
              <select
                className="field-control"
                value={horaInicio}
                onChange={handleChangeInicio}
                disabled={isDecorrer}
              >
                {horariosInicioDisponiveis.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="field-label">Fim</label>
              <select
                className="field-control"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                disabled={isDecorrer}
              >
                {horariosFimDisponiveis.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label className="field-label">Motivo (Opcional)</label>
              <input
                type="text"
                className="field-control"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                disabled={isDecorrer}
              />
            </div>
          </div>

          {isDecorrer && (
            <div
              style={{
                textAlign: "center",
                fontSize: "0.85rem",
                color: "#64748b",
                margin: "-10px 0 10px 0"
              }}
            >
              A reserva está a decorrer.
            </div>
          )}

          <div className="info-card">
            <div className="info-stats">
              <div className="stat-item">
                <span className="stat-label">SALA</span>
                <span className="stat-value">{salaInfo.sala}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">PISO</span>
                <span className="stat-value">{salaInfo.piso}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">CAPACIDADE</span>
                <span className="stat-value">{salaInfo.lugares}</span>
              </div>
            </div>

            <div className="map-row" onClick={handleVerMapa}>
              <FaMapMarkedAlt className="map-icon" />
              <span className="map-text">Ver localização na planta</span>
              <FaChevronRight className="map-arrow" />
            </div>
          </div>

          <div className="modal-footer">
            {isDecorrer ? (
              <button
                type="button"
                className="btn-terminar"
                onClick={handleTerminarAgora}
                disabled={loading}
              >
                <FaStopCircle /> {loading ? "A terminar..." : "Terminar Reserva"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={handlePreCancelar}
                  disabled={loading}
                >
                  <FaTrash /> Cancelar
                </button>
                <button
                  type="button"
                  className="btn-guardar"
                  onClick={handleAtualizar}
                  disabled={loading}
                >
                  <FaSave /> {loading ? "A guardar..." : "Guardar"}
                </button>
              </>
            )}
          </div>

          {showConfirm && (
            <div className="confirm-overlay">
              <div className="confirm-box">
                <FaExclamationTriangle size={32} color="#dc2626" style={{ marginBottom: 12 }} />
                <h3 className="confirm-title">Cancelar Reserva?</h3>
                <p className="confirm-text">
                  A sala ficará livre para outros utilizadores. Esta ação é irreversível.
                </p>
                <div className="confirm-actions">
                  <button type="button" className="btn-nao" onClick={() => setShowConfirm(false)}>
                    Não, voltar
                  </button>
                  <button
                    type="button"
                    className="btn-sim"
                    onClick={handleConfirmarCancelamento}
                    disabled={loading}
                  >
                    Sim, cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
