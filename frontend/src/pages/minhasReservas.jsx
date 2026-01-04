import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import Sidebar from "../components/Sidebar";
import { FaMapMarkedAlt, FaChevronRight } from "react-icons/fa";
import "./Favoritos.css"; 

export default function MinhasReservas() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [reservaSelecionada, setReservaSelecionada] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (!user?.username) return;
    setLoading(true);
    setMsg("");

    fetch(`${API_BASE}/api/reservas/${user.username}`)
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : data?.reservas;
        setReservas(Array.isArray(arr) ? arr : []);
      })
      .catch(() => {
        setReservas([]);
        setMsg("❌ Não foi possível carregar as tuas reservas.");
      })
      .finally(() => setLoading(false));
  }, [user, API_BASE]);

  function getPisoFromNome(nomeSala) {
    if (!nomeSala) return "1";
    const match = nomeSala.match(/\.(\d+)\./);
    if (match && match[1]) return match[1];
    return "1";
  }

  function getSalaId(r) { return String(r?.sala ?? "-"); }
  function getDia(r) { return String(r?.dia ?? "").slice(0, 10); }
  function getHoraInicio(r) { return String(r?.hora_inicio ?? "00:00"); }
  function getHoraFim(r) { return String(r?.hora_fim ?? ""); }
  function getPessoas(r) { return Number(r?.pessoas ?? 1); }

  function formatDiaBR(iso) {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  function isPastReserva(r) {
    const dia = getDia(r);
    const hora = getHoraInicio(r);
    if (!dia || !hora) return false;
    const dt = new Date(`${dia}T${hora}:00`);
    return dt.getTime() < Date.now();
  }

  function removeReservaLocal(id) {
    setReservas((prev) => prev.filter((r) => String(r._id) !== String(id)));
  }

  async function cancelarReserva(reserva) {
    if (!reserva?._id) return;

    const backup = reservas;
    removeReservaLocal(reserva._id);

    try {
      const res = await fetch(`${API_BASE}/api/reservas/${reserva._id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        setReservas(backup);
        alert(data?.message || "Erro a cancelar.");
      } else {
        setReservaSelecionada(null); 
      }
    } catch (e) {
      setReservas(backup);
      alert("Erro de ligação ao cancelar.");
    }
  }

  function ModalVerReserva({ reserva, onClose }) {
    const salaId = getSalaId(reserva);
    const piso = getPisoFromNome(salaId);
    const passada = isPastReserva(reserva);

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          
          <div className="modal-header">
            <div className="header-title-group">
              <h2>Reserva {salaId}</h2>
              <span className={`status-badge ${passada ? "ocupada" : "livre"}`}>
                {passada ? "Passada" : "Ativa"}
              </span>
            </div>
            <button className="btn-close" onClick={onClose}>&times;</button>
          </div>

          <div className="modal-body">
            
            {passada && (
              <div className="warning-box">
                <strong>Reserva antiga</strong>
                <div>Esta reserva já passou e não pode ser alterada.</div>
              </div>
            )}

            <div className="compact-info-section">
              <div className="info-grid-row">
                <p><strong>Dia:</strong> {formatDiaBR(getDia(reserva))}</p>
                <p><strong>Hora:</strong> {getHoraInicio(reserva)} - {getHoraFim(reserva)}</p>
              </div>
              <div className="info-grid-row" style={{ borderBottom: "none" }}>
                <p><strong>Piso:</strong> {piso}</p>
                <p><strong>Pessoas:</strong> {getPessoas(reserva)}</p>
              </div>

              <div 
                className="map-link-card small" 
                onClick={() => {
                  navigate("/mapa", { state: { pisoDestino: piso } });
                }}
              >
                <div className="map-icon-box"><FaMapMarkedAlt /></div>
                <div className="map-link-text">
                  <strong>Ver na Planta</strong>
                </div>
                <FaChevronRight className="chevron-icon" />
              </div>
            </div>

            {!passada && (
              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button
                  className="btn-action"
                  style={{ background: "#ef4444" }} 
                  onClick={() => cancelarReserva(reserva)}
                >
                  Cancelar Reserva
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        <header className="dashboard-header">
          <div><h1 className="dashboard-title">Minhas Reservas</h1></div>
        </header>

        {msg && <div style={{ marginBottom: 14, color: "#b91c1c" }}>{msg}</div>}

        {loading ? (
          <p>⏳ A carregar reservas...</p>
        ) : reservas.length === 0 ? (
          <div className="empty-state">
            <h3>📌 Ainda não tens reservas</h3>
            <p>Vai ao Dashboard e faz uma reserva.</p>
          </div>
        ) : (
          <div className="grid-salas">
            {reservas.map((r) => {
              const salaId = getSalaId(r);
              const piso = getPisoFromNome(salaId);
              const passada = isPastReserva(r);

              return (
                <div
                  key={r._id}
                  className="card-sala fav-card"
                  onClick={() => setReservaSelecionada(r)}
                >
                  <div className={`card-top ${passada ? "ocupada" : "livre"}`}>
                    <span className="statusDot" />
                    <span>{passada ? "Passada" : "Confirmada"}</span>
                  </div>

                  <div className="card-body">
                    {/* Linha 1: Nome */}
                    <div className="card-header-row">
                      <div className="sala-nome">Sala {salaId}</div>
                    </div>

                    {/* Linha 2: Piso */}
                    <div style={{ marginBottom: "12px" }}>
                       <span className="sala-piso-badge">🏢 Piso {piso}</span>
                    </div>

                    {/* ✅ MUDANÇA AQUI: Bloco Data/Hora Limpo (sem emojis) */}
                    <div className="reserva-info-box">
                      <div className="ri-row">
                        <span className="ri-label">Data</span>
                        <span className="ri-value">{formatDiaBR(getDia(r))}</span>
                      </div>
                      <div className="ri-row">
                        <span className="ri-label">Horário</span>
                        <span className="ri-value">
                          {getHoraInicio(r)} às {getHoraFim(r)}
                        </span>
                      </div>
                    </div>

                    <button className="btn-details">
                      Ver detalhes
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {reservaSelecionada && (
          <ModalVerReserva
            reserva={reservaSelecionada}
            onClose={() => setReservaSelecionada(null)}
          />
        )}
      </main>
    </div>
  );
}