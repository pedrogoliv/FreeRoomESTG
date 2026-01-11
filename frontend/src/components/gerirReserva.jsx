import { useState } from "react";
import "./gerirReserva.css";
import { FaTimes, FaTrash, FaSave, FaMapMarkedAlt, FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function GerirReserva({ 
  salaInfo,      
  reserva,       
  user, 
  onClose, 
  onSuccess      
}) {
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const [dia, setDia] = useState(reserva.dia);
  const [horaInicio, setHoraInicio] = useState(reserva.hora_inicio);
  const [horaFim, setHoraFim] = useState(reserva.hora_fim);
  const [pessoas, setPessoas] = useState(reserva.pessoas);
  const [motivo, setMotivo] = useState(reserva.motivo || "");
  
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Lista de horários
  const horarios = [];
  for (let h = 8; h <= 22; h++) {
    const hh = String(h).padStart(2, "0");
    horarios.push(`${hh}:00`);
    if (h < 22) horarios.push(`${hh}:30`);
  }

  const handleAtualizar = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/reservas/${reserva._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dia, hora_inicio: horaInicio, hora_fim: horaFim,
          pessoas: Number(pessoas), responsavel: user.username, motivo
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Reserva atualizada com sucesso!");
        if (onSuccess) onSuccess();
      } else {
        setMsg(data.message || "Erro ao atualizar.");
      }
    } catch (error) { setMsg("Erro de conexão."); } 
    finally { setLoading(false); }
  };

  const handleCancelar = async () => {
    if (!window.confirm("Tens a certeza que queres cancelar esta reserva?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reservas/${reserva._id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        alert("Reserva cancelada.");
        if (onSuccess) onSuccess(); 
      } else {
        setMsg(data.message || "Erro ao cancelar.");
      }
    } catch (e) { setMsg("Erro de conexão."); } 
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER ROXO */}
        <div className="modal-header">
          <div className="header-title-group">
            <h2>Gerir Reserva</h2>
            <span className="status-badge minha">MINHA RESERVA</span>
          </div>
          <button className="btn-close" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="modal-body">
          {msg && <div className="msg-error">{msg}</div>}

          {/* FORMULÁRIO COM O NOVO DESIGN */}
          <div className="form-grid-compact">
            <div className="form-group">
              <label className="field-label">Dia</label>
              <input type="date" className="field-control" value={dia} onChange={e => setDia(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="field-label">Pessoas</label>
              <input type="number" className="field-control" min="1" max={salaInfo.lugares} value={pessoas} onChange={e => setPessoas(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="field-label">Início</label>
              <select className="field-control" value={horaInicio} onChange={e => setHoraInicio(e.target.value)}>
                {horarios.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="field-label">Fim</label>
              <select className="field-control" value={horaFim} onChange={e => setHoraFim(e.target.value)}>
                {horarios.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="form-group full-width">
              <label className="field-label">Motivo (Opcional)</label>
              <input type="text" className="field-control" value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ex: Reunião de grupo..." />
            </div>
          </div>

          {/* INFO CARD DA SALA */}
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
             
             {/* Link Mapa Estilizado */}
             <div 
               className="map-row" 
               onClick={() => navigate("/mapa", { state: { pisoDestino: salaInfo.piso, salaDestino: salaInfo.sala } })}
             >
               <FaMapMarkedAlt className="map-icon" />
               <span className="map-text">Ver localização na planta</span>
               <FaChevronRight className="map-arrow" />
             </div>
          </div>

          {/* RODAPÉ COM BOTÕES */}
          <div className="modal-footer">
            <button className="btn-cancelar" onClick={handleCancelar} disabled={loading}>
              <FaTrash /> Cancelar
            </button>
            
            <button className="btn-guardar" onClick={handleAtualizar} disabled={loading}>
              <FaSave /> {loading ? "A guardar..." : "Guardar Alterações"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}