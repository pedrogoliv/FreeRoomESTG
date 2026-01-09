import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./HistoricoReservas.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function formatDia(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function isReservaPassada(r) {
  const dia = String(r?.dia || "").slice(0, 10);
  const horaRef = r?.hora_fim || r?.hora_inicio;
  if (!dia || !horaRef) return false;

  const dt = new Date(`${dia}T${horaRef}:00`);
  if (Number.isNaN(dt.getTime())) return false;

  return dt.getTime() < Date.now();
}

export default function HistoricoReservas() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      const stored = sessionStorage.getItem("user") || localStorage.getItem("user");
      return JSON.parse(stored || "null");
    } catch {
      return null;
    }
  }, []);

  const username = user?.username;

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [reservas, setReservas] = useState([]);

  const fetchHistorico = useCallback(async () => {
    if (!username) return;

    setLoading(true);
    setErro("");

    try {
      const resp = await fetch(`${API_BASE}/api/reservas-historico/${username}?limit=50`);
      const data = await resp.json().catch(() => ({}));

      if (!resp.ok || !data?.success) {
        throw new Error(data?.message || "Erro ao obter histórico.");
      }

      setReservas(Array.isArray(data.reservas) ? data.reservas : []);
    } catch (e) {
      setErro(e?.message || "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (!username) {
      navigate("/login");
      return;
    }
    fetchHistorico();
  }, [username, navigate, fetchHistorico]);

  return (
    <div className="page-layout">
      <Sidebar />

      <div className="historico-page">
        <div className="historico-header">
          <h1>Histórico de Reservas</h1>
        </div>

        {loading && <div className="historico-state">A carregar…</div>}

        {!loading && erro && <div className="historico-error">⚠️ {erro}</div>}

        {!loading && !erro && reservas.length === 0 && (
          <div className="historico-empty">
            <h3>Ainda não tens histórico</h3>
            <p>Quando fizeres reservas, elas vão aparecer aqui.</p>
          </div>
        )}

        {!loading && !erro && reservas.length > 0 && (
          <div className="historico-grid">
            {reservas.map((r) => {
              const statusRaw = r?.status || "ativa";
              const isCancelada = statusRaw === "cancelada";
              const isPassada = !isCancelada && isReservaPassada(r);

              // ✅ 3 estados finais
              const statusFinal = isCancelada ? "cancelada" : isPassada ? "concluida" : "ativa";

              const badgeText =
                statusFinal === "cancelada"
                  ? "CANCELADA"
                  : statusFinal === "concluida"
                  ? "CONCLUÍDA"
                  : "ATIVA";

              return (
                <div key={r._id} className="historico-card">
                  <div className={`historico-badge ${statusFinal}`}>{badgeText}</div>

                  <div className="historico-card-title">{r?.sala || "Sala —"}</div>

                  <div className="historico-card-meta">
                    <span>
                      <strong>Dia:</strong> {formatDia(r?.dia)}
                    </span>
                    <span>
                      <strong>Hora:</strong> {r?.hora_inicio || "—"} - {r?.hora_fim || "—"}
                    </span>
                    <span>
                      <strong>Pessoas:</strong> {r?.pessoas ?? 1}
                    </span>
                  </div>

                  {r?.motivo ? (
                    <div className="historico-motivo">
                      <strong>Motivo:</strong> {r.motivo}
                    </div>
                  ) : null}

                  {statusFinal === "concluida" ? (
                    <div className="historico-note concluida">
                      <strong>Estado:</strong> Reserva concluída (já passou).
                    </div>
                  ) : null}

                  {statusFinal === "cancelada" && r?.canceledAt ? (
                    <div className="historico-note cancelada">
                      <strong>Cancelada em:</strong>{" "}
                      {new Date(r.canceledAt).toLocaleString("pt-PT")}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
