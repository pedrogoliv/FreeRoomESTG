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

export default function HistoricoReservas() {
  const navigate = useNavigate();

  // ✅ Lê do mesmo sítio que o resto da app (sessionStorage)
  // (e se quiseres, faz fallback para localStorage)
  const user = useMemo(() => {
    try {
      const stored =
        sessionStorage.getItem("user") || localStorage.getItem("user");
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
      const resp = await fetch(
        `${API_BASE}/api/reservas-historico/${username}?limit=50`
      );
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
    // ✅ Se não estiver autenticado, manda para login (não para "/")
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
          <p>Consulta as tuas últimas reservas (ativas e canceladas).</p>

          <div className="historico-actions">
            <button
              className="btn-secondary"
              type="button"
              onClick={() => navigate("/perfil")}
            >
              Voltar ao Perfil
            </button>
            <button className="btn-primary" type="button" onClick={fetchHistorico}>
              Atualizar
            </button>
          </div>
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
              const status = r?.status || "ativa";
              const isCancelada = status === "cancelada";

              return (
                <div key={r._id} className="historico-card">
                  <div
                    className={`historico-badge ${
                      isCancelada ? "cancelada" : "ativa"
                    }`}
                  >
                    {isCancelada ? "CANCELADA" : "ATIVA"}
                  </div>

                  <div className="historico-card-title">{r?.sala || "Sala —"}</div>

                  <div className="historico-card-meta">
                    <span>
                      <strong>Dia:</strong> {formatDia(r?.dia)}
                    </span>
                    <span>
                      <strong>Hora:</strong> {r?.hora_inicio || "—"} -{" "}
                      {r?.hora_fim || "—"}
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

                  {isCancelada && r?.canceledAt ? (
                    <div className="historico-cancel">
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
