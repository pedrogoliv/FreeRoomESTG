import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import Sidebar from "../components/Sidebar";
import { FaMapMarkedAlt, FaChevronRight, FaCalendarAlt, FaClock, FaUserFriends, FaHistory } from "react-icons/fa";
import "./minhasreservas.css"; 

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

  // --- HELPERS ---
  function getPisoFromNome(nomeSala) {
    if (!nomeSala) return "1";
    const match = nomeSala.match(/\.(\d+)\./);
    return match && match[1] ? match[1] : "1";
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

  async function cancelarReserva(reserva) {
    if (!reserva?._id) return;
    if (!window.confirm("Queres mesmo cancelar esta reserva?")) return;

    const backup = reservas;
    setReservas((prev) => prev.filter((r) => r._id !== reserva._id));
    if (reservaSelecionada?._id === reserva._id) setReservaSelecionada(null);

    try {
      const res = await fetch(`${API_BASE}/api/reservas/${reserva._id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        setReservas(backup);
        alert(data?.message || "Erro ao cancelar.");
      }
    } catch (e) {
      setReservas(backup);
      alert("Erro de ligação.");
    }
  }

  // Separação das Reservas
  const reservasFuturas = reservas.filter(r => !isPastReserva(r));
  const reservasPassadas = reservas.filter(r => isPastReserva(r));

  // Ordenação (Futuras: mais perto primeiro | Passadas: mais recentes primeiro)
  reservasFuturas.sort((a, b) => new Date(`${getDia(a)}T${getHoraInicio(a)}`) - new Date(`${getDia(b)}T${getHoraInicio(b)}`));
  reservasPassadas.sort((a, b) => new Date(`${getDia(b)}T${getHoraInicio(b)}`) - new Date(`${getDia(a)}T${getHoraInicio(a)}`));

  // --- COMPONENTES DE CARTÃO ---
  function CardReservaAtiva({ r }) {
    const salaId = getSalaId(r);
    const dia = getDia(r);
    const piso = getPisoFromNome(salaId);

    return (
      <div className="reserva-row ativa" onClick={() => setReservaSelecionada(r)}>
        <div className="date-badge">
          <span className="date-day">{dia.split("-")[2]}</span>
          <span className="date-month">
            {new Date(dia).toLocaleString('pt-PT', { month: 'short' }).replace('.', '')}
          </span>
        </div>
        <div className="row-info">
          <div className="row-header">
            <span className="sala-name">Sala {salaId}</span>
          </div>
          <div className="row-details">
            <span><FaClock size={12} /> {getHoraInicio(r)} - {getHoraFim(r)}</span>
            <span className="divider">•</span>
            <span>Piso {piso}</span>
          </div>
        </div>
        <div className="row-action">
          <FaChevronRight />
        </div>
      </div>
    );
  }

  function CardReservaPassada({ r }) {
    const salaId = getSalaId(r);
    const dia = getDia(r);

    return (
      <div className="history-row" onClick={() => setReservaSelecionada(r)}>
        <div className="history-icon">
          <FaHistory />
        </div>
        <div className="history-info">
          <div className="history-sala">Sala {salaId}</div>
          <div className="history-date">
            {formatDiaBR(dia)} • {getHoraInicio(r)}
          </div>
        </div>
        <div className="history-action">Ver</div>
      </div>
    );
  }

  // --- MODAL ---
  function ModalVerReserva({ reserva, onClose }) {
    const salaId = getSalaId(reserva);
    const piso = getPisoFromNome(salaId);
    const passada = isPastReserva(reserva);

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="header-left">
              <h2>Sala {salaId}</h2>
              <span className={`status-pill ${passada ? "passada" : "ativa"}`}>
                {passada ? "Histórico" : "Confirmada"}
              </span>
            </div>
            <button className="btn-close" onClick={onClose}>&times;</button>
          </div>

          <div className="modal-body">
            <div className="info-row">
              <div className="info-item">
                <FaCalendarAlt className="icon" />
                <div>
                  <label>Data</label>
                  <strong>{formatDiaBR(getDia(reserva))}</strong>
                </div>
              </div>
              <div className="info-item">
                <FaClock className="icon" />
                <div>
                  <label>Horário</label>
                  <strong>{getHoraInicio(reserva)} - {getHoraFim(reserva)}</strong>
                </div>
              </div>
            </div>

            <div className="info-row">
              <div className="info-item">
                <FaUserFriends className="icon" />
                <div>
                  <label>Pessoas</label>
                  <strong>{getPessoas(reserva)}</strong>
                </div>
              </div>
              <div className="info-item">
                <strong>Piso {piso}</strong>
              </div>
            </div>

            <button 
              className="btn-mapa" 
              onClick={() => navigate("/mapa", { state: { pisoDestino: piso } })}
            >
              <FaMapMarkedAlt /> Ver localização na planta
            </button>

            {!passada && (
              <button className="btn-cancelar" onClick={() => cancelarReserva(reserva)}>
                Cancelar Reserva
              </button>
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
          <h1 className="dashboard-title">Minhas Reservas</h1>
        </header>

        {msg && <div className="msg-box error">{msg}</div>}

        {loading ? (
          <p className="loading-text">⏳ A carregar a tua agenda...</p>
        ) : (
          <div className="reservas-split-layout">
            
            {/* COLUNA ESQUERDA: FUTURAS */}
            <div className="coluna-principal">
              <h3 className="section-title">Próximas Reservas ({reservasFuturas.length})</h3>
              
              {reservasFuturas.length === 0 ? (
                <div className="empty-state-card">
                  <p>Não tens reservas ativas.</p>
                  <button onClick={() => navigate("/dashboard")} className="btn-link">
                    Fazer nova reserva
                  </button>
                </div>
              ) : (
                <div className="lista-futuras">
                  {reservasFuturas.map((r) => (
                    <CardReservaAtiva key={r._id} r={r} />
                  ))}
                </div>
              )}
            </div>

            {/* COLUNA DIREITA: HISTÓRICO */}
            <div className="coluna-lateral">
              <h3 className="section-title history">Histórico</h3>
              
              {reservasPassadas.length === 0 ? (
                <p className="text-muted">Sem histórico.</p>
              ) : (
                <div className="lista-passadas">
                  {reservasPassadas.map((r) => (
                    <CardReservaPassada key={r._id} r={r} />
                  ))}
                </div>
              )}
            </div>

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