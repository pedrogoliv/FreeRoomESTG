import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom"; 
import Sidebar from "../components/Sidebar";
import GerirReserva from "../components/gerirReserva";
import { FaMapMarkedAlt, FaChevronRight, FaCalendarAlt, FaClock, FaUserFriends, FaHistory } from "react-icons/fa";
import "./MinhasReservas.css"; 

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

  // ✅ 2. Função de carregar reservas (para usar no refresh)
  const carregarReservas = useCallback(() => {
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

  // Carregar ao iniciar
  useEffect(() => {
    carregarReservas();
  }, [carregarReservas]);

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
    const horaFim = getHoraFim(r); 
    if (!dia || !horaFim) return false;
    const dtFim = new Date(`${dia}T${horaFim}:00`);
    return dtFim.getTime() < Date.now();
  }

  // Separação das Reservas
  const reservasFuturas = reservas.filter(r => !isPastReserva(r));
  const reservasPassadas = reservas.filter(r => isPastReserva(r));

  // Ordenação
  reservasFuturas.sort((a, b) => new Date(`${getDia(a)}T${getHoraInicio(a)}`) - new Date(`${getDia(b)}T${getHoraInicio(b)}`));
  reservasPassadas.sort((a, b) => new Date(`${getDia(b)}T${getHoraInicio(b)}`) - new Date(`${getDia(a)}T${getHoraInicio(a)}`));

  // --- COMPONENTES VISUAIS (Cartões) ---
  function CardReservaAtiva({ r }) {
    const salaId = getSalaId(r);
    const dia = getDia(r);
    const piso = getPisoFromNome(salaId);

    const agora = new Date();
    const dataInicio = new Date(`${dia}T${getHoraInicio(r)}:00`);
    const dataFim = new Date(`${dia}T${getHoraFim(r)}:00`);
    const aDecorrer = agora >= dataInicio && agora < dataFim;

    return (
      <div 
        className={`reserva-row ativa ${aDecorrer ? "em-curso" : ""}`} 
        onClick={() => setReservaSelecionada(r)}
      >
        <div className="date-badge">
          <span className="date-day">{dia.split("-")[2]}</span>
          <span className="date-month">
            {new Date(dia).toLocaleString('pt-PT', { month: 'short' }).replace('.', '')}
          </span>
        </div>
        
        <div className="row-info">
          <div className="row-header">
            <span className="sala-name">Sala {salaId}</span>
            {aDecorrer && <span className="tag-status">A DECORRER</span>}
          </div>
          <div className="row-details">
            <span style={{ color: aDecorrer ? '#22c55e' : 'inherit', fontWeight: aDecorrer ? 'bold' : 'normal' }}>
              <FaClock size={12} /> {getHoraInicio(r)} - {getHoraFim(r)}
            </span>
            <span className="divider">•</span>
            <span>Piso {piso}</span>
          </div>
        </div>
        <div className="row-action"><FaChevronRight /></div>
      </div>
    );
  }

  function CardReservaPassada({ r }) {
    const salaId = getSalaId(r);
    const dia = getDia(r);
    return (
      <div className="history-row" onClick={() => setReservaSelecionada(r)}>
        <div className="history-icon"><FaHistory /></div>
        <div className="history-info">
          <div className="history-sala">Sala {salaId}</div>
          <div className="history-date">{formatDiaBR(dia)} • {getHoraInicio(r)}</div>
        </div>
        <div className="history-action">Ver</div>
      </div>
    );
  }

  // --- MODAL DE APENAS LEITURA (Para Histórico) ---
  function ModalVerHistorico({ reserva, onClose }) {
    const salaId = getSalaId(reserva);
    const piso = getPisoFromNome(salaId);

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="header-left">
              <h2>Sala {salaId}</h2>
              <span className="status-badge ocupada">Histórico</span>
            </div>
            <button className="btn-close" onClick={onClose}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="info-row">
              <div className="info-item"><FaCalendarAlt className="icon" /> <div><label>Data</label><strong>{formatDiaBR(getDia(reserva))}</strong></div></div>
              <div className="info-item"><FaClock className="icon" /> <div><label>Horário</label><strong>{getHoraInicio(reserva)} - {getHoraFim(reserva)}</strong></div></div>
            </div>
            <div className="info-row">
              <div className="info-item"><FaUserFriends className="icon" /> <div><label>Pessoas</label><strong>{getPessoas(reserva)}</strong></div></div>
              <div className="info-item"><strong>Piso {piso}</strong></div>
            </div>
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
            
            <div className="coluna-principal">
              <h3 className="section-title">Próximas Reservas ({reservasFuturas.length})</h3>
              {reservasFuturas.length === 0 ? (
                <div className="empty-state-card">
                  <p>Não tens reservas ativas.</p>
                  <button onClick={() => navigate("/dashboard")} className="btn-link">Fazer nova reserva</button>
                </div>
              ) : (
                <div className="lista-futuras">
                  {reservasFuturas.map((r) => <CardReservaAtiva key={r._id} r={r} />)}
                </div>
              )}
            </div>

            <div className="coluna-lateral">
              <h3 className="section-title history">Histórico</h3>
              <div className="historico-box">
                {reservasPassadas.length === 0 ? (
                  <p className="text-muted">Sem histórico.</p>
                ) : (
                  <div className="lista-passadas">
                    {reservasPassadas.map((r) => <CardReservaPassada key={r._id} r={r} />)}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ✅ 3. LÓGICA DE SELEÇÃO DE MODAL */}
        {reservaSelecionada && (
          isPastReserva(reservaSelecionada) ? (
            // Se for passado -> Mostra apenas leitura
            <ModalVerHistorico 
              reserva={reservaSelecionada} 
              onClose={() => setReservaSelecionada(null)} 
            />
          ) : (
            // Se for futuro -> Abre o GerirReserva (Editável)
            <GerirReserva
              salaInfo={{ 
                sala: reservaSelecionada.sala, 
                piso: getPisoFromNome(reservaSelecionada.sala),
                lugares: 15 // Hack: Como a lista não traz capacidade, assumimos 15 por defeito
              }}
              reserva={reservaSelecionada}
              user={user}
              onClose={() => setReservaSelecionada(null)}
              onSuccess={() => {
                setReservaSelecionada(null);
                carregarReservas(); // Atualiza a lista após editar/cancelar
              }}
            />
          )
        )}

      </main>
    </div>
  );
}