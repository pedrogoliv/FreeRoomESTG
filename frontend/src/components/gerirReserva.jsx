import { useState, useEffect } from "react";
import "./gerirReserva.css"; 
import { FaTimes, FaTrash, FaSave, FaMapMarkedAlt, FaChevronRight, FaExclamationTriangle, FaStopCircle } from "react-icons/fa";
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

  const dadosSalvos = salaInfo.estadoPreservado || {};

  const [dia, setDia] = useState(dadosSalvos.dia || reserva.dia);
  const [horaInicio, setHoraInicio] = useState(dadosSalvos.horaInicio || reserva.hora_inicio);
  const [horaFim, setHoraFim] = useState(dadosSalvos.horaFim || reserva.hora_fim);
  const [pessoas, setPessoas] = useState(dadosSalvos.pessoas || reserva.pessoas);
  const [motivo, setMotivo] = useState(dadosSalvos.motivo || reserva.motivo || "");
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const hojeISO = now.toISOString().split("T")[0];
  const agoraStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const isDecorrer = (dia === hojeISO && horaInicio <= agoraStr && horaFim > agoraStr);

  const horarios = [];
  for (let h = 8; h <= 23; h++) {
    const hh = String(h).padStart(2, "0");
    horarios.push(`${hh}:00`);
    if (h < 23) horarios.push(`${hh}:30`);
  }

  const horariosInicioDisponiveis = horarios.filter(h => {
    if (h === "23:00") return false;
    if (dia === hojeISO && !isDecorrer) {
       return h >= agoraStr || h === reserva.hora_inicio || h === horaInicio;
    }
    return true;
  });

  const horariosFimDisponiveis = horarios.filter(h => h > horaInicio);

  const handleChangeInicio = (e) => {
    const novoInicio = e.target.value;
    setHoraInicio(novoInicio);
    if (horaFim <= novoInicio) {
      const index = horarios.indexOf(novoInicio);
      if (index !== -1 && index < horarios.length - 1) {
        setHoraFim(horarios[index + 1]);
      } else {
        const ultimoSlot = horarios[horarios.length - 1]; 
        if (novoInicio < ultimoSlot) setHoraFim(ultimoSlot);
      }
    }
  };

  const handleAtualizar = async () => {
    setLoading(true);
    setMsg("");
    const dadosParaEnviar = {
      dia, hora_inicio: horaInicio, hora_fim: horaFim,
      pessoas: Number(pessoas), responsavel: user.username, motivo
    };

    try {
      const res = await fetch(`${API_BASE}/api/reservas/${reserva._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosParaEnviar),
      });
      const data = await res.json();
      if (res.ok && data.success) { if (onSuccess) onSuccess(); } 
      else { setMsg(data.message || "Erro ao atualizar."); }
    } catch (error) { setMsg("Erro de conexão."); } 
    finally { setLoading(false); }
  };

  const handleTerminarAgora = async () => {
    setLoading(true);
    setMsg("");

    const timeNow = new Date();
    const h = timeNow.getHours();
    const m = timeNow.getMinutes();
    
    let novoFim = "";
    if (m < 30) {
      novoFim = `${String(h).padStart(2, "0")}:30`;
    } else {
      novoFim = `${String(h + 1).padStart(2, "0")}:00`;
    }

    if (novoFim > reserva.hora_fim) novoFim = reserva.hora_fim;


    const dadosParaEnviar = {
      dia: reserva.dia,
      hora_inicio: reserva.hora_inicio,
      hora_fim: novoFim,
      pessoas: reserva.pessoas,
      responsavel: user.username,
      motivo: reserva.motivo
    };

    try {
      const res = await fetch(`${API_BASE}/api/reservas/${reserva._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosParaEnviar),
      });

      const data = await res.json();

      if (res.ok) {
        if (onSuccess) onSuccess();
      } else {
        console.error("Erro backend:", data);
        setMsg(data.message || "Erro ao terminar reserva.");
      }
    } catch (e) {
      console.error(e);
      setMsg("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handlePreCancelar = () => { setShowConfirm(true); };

  const handleConfirmarCancelamento = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reservas/${reserva._id}`, { method: "DELETE" });
      if (res.ok) { if (onSuccess) onSuccess(); } 
      else { setMsg("Erro ao cancelar."); }
    } catch (e) { setMsg("Erro de conexão."); } 
    finally { setLoading(false); }
  };

  const handleVerMapa = () => {
    navigate("/mapa", { 
      state: { 
        pisoDestino: salaInfo.piso, salaDestino: salaInfo.sala,
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
          <button className="btn-close" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="modal-body">
          {msg && <div className="msg-error">{msg}</div>}

          <div className="form-grid-compact">
            <div className="form-group">
              <label className="field-label">Dia</label>
              <input type="date" className="field-control" 
                value={dia} onChange={e => setDia(e.target.value)} 
                min={hojeISO} 
                disabled={isDecorrer}
              />
            </div>
            <div className="form-group">
              <label className="field-label">Pessoas</label>
              <input type="number" className="field-control" min="1" max={salaInfo.lugares} 
                value={pessoas} onChange={e => setPessoas(e.target.value)} 
                disabled={isDecorrer}
              />
            </div>
            
            <div className="form-group">
              <label className="field-label">Início</label>
              <select className="field-control" value={horaInicio} onChange={handleChangeInicio} disabled={isDecorrer}>
                {horariosInicioDisponiveis.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="field-label">Fim</label>
              <select className="field-control" value={horaFim} onChange={e => setHoraFim(e.target.value)} disabled={isDecorrer}>
                {horariosFimDisponiveis.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            
            <div className="form-group full-width">
              <label className="field-label">Motivo (Opcional)</label>
              <input type="text" className="field-control" 
                value={motivo} onChange={e => setMotivo(e.target.value)} 
                placeholder="Ex: Reunião de grupo..." 
                disabled={isDecorrer} 
              />
            </div>
          </div>

          {isDecorrer && (
            <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b', margin: '-10px 0 10px 0' }}>
              A reserva está a decorrer.
            </div>
          )}

          <div className="info-card">
             <div className="info-stats">
               <div className="stat-item"><span className="stat-label">SALA</span><span className="stat-value">{salaInfo.sala}</span></div>
               <div className="stat-item"><span className="stat-label">PISO</span><span className="stat-value">{salaInfo.piso}</span></div>
               <div className="stat-item"><span className="stat-label">CAPACIDADE</span><span className="stat-value">{salaInfo.lugares}</span></div>
             </div>
             <div className="map-row" onClick={handleVerMapa}>
               <FaMapMarkedAlt className="map-icon" /><span className="map-text">Ver localização na planta</span><FaChevronRight className="map-arrow" />
             </div>
          </div>

          <div className="modal-footer">
            {isDecorrer ? (
              <button className="btn-terminar" onClick={handleTerminarAgora} disabled={loading}>
                <FaStopCircle /> Terminar Reserva
              </button>
            ) : (
              <>
                <button className="btn-cancelar" onClick={handlePreCancelar} disabled={loading}>
                  <FaTrash /> Cancelar
                </button>
                <button className="btn-guardar" onClick={handleAtualizar} disabled={loading}>
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
                <p className="confirm-text">A sala ficará livre para outros utilizadores. Esta ação é irreversível.</p>
                <div className="confirm-actions">
                  <button className="btn-nao" onClick={() => setShowConfirm(false)}>Não, voltar</button>
                  <button className="btn-sim" onClick={handleConfirmarCancelamento}>Sim, cancelar</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}