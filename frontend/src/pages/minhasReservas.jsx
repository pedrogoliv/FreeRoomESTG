import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import "./Favoritos.css"; // reaproveita o mesmo estilo dos Favoritos (cards/grid/modal)

export default function MinhasReservas() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const [user, setUser] = useState(null);

  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // Modal
  const [reservaSelecionada, setReservaSelecionada] = useState(null);

  // ler user do storage (igual Favoritos)
  useEffect(() => {
    const stored = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // buscar reservas
  useEffect(() => {
    if (!user?.username) return;

    setLoading(true);
    setMsg("");

    fetch(`${API_BASE}/api/reservas/${user.username}`)
      .then((r) => r.json())
      .then((data) => {
        // backend devolve { success: true, reservas }
        const arr = Array.isArray(data) ? data : data?.reservas;
        setReservas(Array.isArray(arr) ? arr : []);
      })
      .catch(() => {
        setReservas([]);
        setMsg("❌ Não foi possível carregar as tuas reservas.");
      })
      .finally(() => setLoading(false));
  }, [user, API_BASE]);

  function abrirDetalhes(reserva) {
    setMsg("");
    setReservaSelecionada(reserva);
  }

  // ======== helpers alinhados com o teu model Reserva ========
  function getSalaId(r) {
    return String(r?.sala ?? "-");
  }
  function getDia(r) {
    return String(r?.dia ?? "").slice(0, 10); // YYYY-MM-DD
  }
  function getHoraInicio(r) {
    return String(r?.hora_inicio ?? "00:00");
  }
  function getHoraFim(r) {
    return String(r?.hora_fim ?? "");
  }
  function getPessoas(r) {
    return Number(r?.pessoas ?? 1);
  }
  function getMotivo(r) {
    return String(r?.motivo ?? "");
  }
  function getResponsavel(r) {
    return String(r?.responsavel ?? "");
  }

  // slots 30 em 30
  const timeSlots = useMemo(() => {
    const out = [];
    for (let h = 8; h <= 22; h++) {
      out.push(`${String(h).padStart(2, "0")}:00`);
      out.push(`${String(h).padStart(2, "0")}:30`);
    }
    return out;
  }, []);

  function formatDiaBR(iso) {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    if (!y || !m || !d) return iso;
    return `${d}/${m}/${y}`;
  }

  function isPastReserva(r) {
    const dia = getDia(r);
    const hora = getHoraInicio(r);
    if (!dia || !hora) return false;
    const dt = new Date(`${dia}T${hora}:00`);
    return dt.getTime() < Date.now();
  }

  // Atualiza reserva na lista (helper)
  function updateReservaLocal(updated) {
    setReservas((prev) =>
      prev.map((r) => (String(r._id) === String(updated._id) ? updated : r))
    );
  }

  // Remove reserva da lista (helper)
  function removeReservaLocal(id) {
    setReservas((prev) => prev.filter((r) => String(r._id) !== String(id)));
  }

  async function cancelarReserva(reserva) {
    if (!reserva?._id) return;

    // UI otimista
    const backup = reservas;
    removeReservaLocal(reserva._id);

    try {
      const res = await fetch(`${API_BASE}/api/reservas/${reserva._id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        setReservas(backup);
        throw new Error(data?.message || "Erro a cancelar.");
      }

      setReservaSelecionada(null);
      setMsg("✅ Reserva cancelada.");
    } catch (e) {
      setMsg("❌ Não foi possível cancelar a reserva.");
    }
  }

  async function verificarSalaLivre(salaId, dia, horaInicio) {
    // endpoint existente para salas livres naquele slot
    const res = await fetch(
      `${API_BASE}/api/salas-livres?dia=${encodeURIComponent(dia)}&hora=${encodeURIComponent(
        horaInicio
      )}`
    );
    const data = await res.json().catch(() => []);
    const arr = Array.isArray(data) ? data : [];
    return arr.some((s) => String(s?.sala) === String(salaId));
  }

  async function atualizarReserva(reservaId, patch) {
    const res = await fetch(`${API_BASE}/api/reservas/${reservaId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.success === false) {
      throw new Error(data?.message || "Erro ao atualizar.");
    }

    // backend devolve { success:true, reserva }
    return data?.reserva ?? data;
  }

  // Modal (com estado interno)
  function ModalDetalhesReserva({ reserva, onClose }) {
    const salaId = getSalaId(reserva);

    const [pessoas, setPessoas] = useState(getPessoas(reserva));
    const [dia, setDia] = useState(getDia(reserva));
    const [horaInicio, setHoraInicio] = useState(getHoraInicio(reserva));
    const [saving, setSaving] = useState(false);
    const [localMsg, setLocalMsg] = useState("");

    const isPast = isPastReserva(reserva);

    async function onGuardarAlteracoes() {
      setLocalMsg("");

      // validações simples
      if (!dia) return setLocalMsg("⚠️ Escolhe uma data.");
      if (!horaInicio) return setLocalMsg("⚠️ Escolhe uma hora.");
      const p = Number(pessoas);
      if (!Number.isFinite(p) || p < 1 || p > 300) {
        return setLocalMsg("⚠️ Nº de pessoas inválido.");
      }

      setSaving(true);
      try {
        // se mudou slot (dia/hora), confirma se a sala está livre nesse slot
        const diaOriginal = getDia(reserva);
        const horaOriginal = getHoraInicio(reserva);

        const mudouSlot = dia !== diaOriginal || horaInicio !== horaOriginal;
        if (mudouSlot) {
          const livre = await verificarSalaLivre(salaId, dia, horaInicio);
          if (!livre) {
            setSaving(false);
            return setLocalMsg("❌ A sala está ocupada nessa data/hora.");
          }
        }

        // PATCH alinhado com o backend/model
        const patch = {
          pessoas: Number(pessoas),
          dia,
          hora_inicio: horaInicio,
        };

        const updated = await atualizarReserva(reserva._id, patch);
        updateReservaLocal(updated);
        setLocalMsg("✅ Alterações guardadas.");
      } catch (e) {
        setLocalMsg(`❌ ${e.message || "Erro ao guardar."}`);
      } finally {
        setSaving(false);
      }
    }

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>📌 Reserva — Sala {salaId}</h2>
            <button className="btn-close" onClick={onClose} type="button">
              &times;
            </button>
          </div>

          <div className="modal-body">
            <p style={{ marginTop: 0, color: "#64748b", fontWeight: 600 }}>
              Data atual: <strong>{formatDiaBR(getDia(reserva))}</strong> — Hora:{" "}
              <strong>{getHoraInicio(reserva)}</strong>
              {getHoraFim(reserva) ? (
                <>
                  {" "}
                  até <strong>{getHoraFim(reserva)}</strong>
                </>
              ) : null}
            </p>

            {getMotivo(reserva) && (
              <p style={{ marginTop: 8, color: "#475569", fontWeight: 650 }}>
                Motivo: <span style={{ fontWeight: 600 }}>{getMotivo(reserva)}</span>
              </p>
            )}

            {getResponsavel(reserva) && (
              <p style={{ marginTop: 6, color: "#475569", fontWeight: 650 }}>
                Responsável:{" "}
                <span style={{ fontWeight: 600 }}>{getResponsavel(reserva)}</span>
              </p>
            )}

            {isPast && (
              <div className="warning-box" style={{ marginBottom: 12, marginTop: 12 }}>
                ⚠️ Esta reserva já passou. Podes ver detalhes, mas não editar/cancelar.
              </div>
            )}

            <div className="form-stack" style={{ marginTop: 12 }}>
              <label className="field-label">Nº de pessoas</label>
              <input
                className="field-control"
                type="number"
                min={1}
                max={300}
                value={pessoas}
                onChange={(e) => setPessoas(e.target.value)}
                disabled={saving || isPast}
              />

              <label className="field-label" style={{ marginTop: 10 }}>
                Nova data
              </label>
              <input
                className="field-control"
                type="date"
                value={dia}
                onChange={(e) => setDia(e.target.value)}
                disabled={saving || isPast}
              />

              <label className="field-label" style={{ marginTop: 10 }}>
                Nova hora (início)
              </label>
              <select
                className="field-control"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                disabled={saving || isPast}
              >
                {timeSlots.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {localMsg && (
                <p
                  style={{
                    marginTop: 10,
                    fontWeight: 700,
                    color: localMsg.startsWith("✅") ? "#16a34a" : "#b91c1c",
                  }}
                >
                  {localMsg}
                </p>
              )}

              <div className="modal-actions" style={{ marginTop: 14 }}>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                >
                  Fechar
                </button>

                <button
                  className="btn-primary"
                  type="button"
                  onClick={onGuardarAlteracoes}
                  disabled={saving || isPast}
                >
                  {saving ? "A guardar..." : "Guardar alterações"}
                </button>

                <button
                  className="btn-danger"
                  type="button"
                  onClick={() => cancelarReserva(reserva)}
                  disabled={saving || isPast}
                  title={isPast ? "Reserva já passou" : "Cancelar esta reserva"}
                >
                  Cancelar reserva
                </button>
              </div>

              <p style={{ marginTop: 10, color: "#64748b", fontSize: "0.9rem" }}>
                * A mudança de hora verifica disponibilidade via{" "}
                <code>/api/salas-livres</code> (slot de 30min).
              </p>
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
          <div>
            <h1 className="dashboard-title">Minhas Reservas</h1>
            <p style={{ color: "#64748b" }}>
              Vê as tuas reservas e faz alterações quando necessário.
            </p>
          </div>
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
              const dia = getDia(r);
              const horaIni = getHoraInicio(r);
              const horaFim = getHoraFim(r);
              const pessoas = getPessoas(r);
              const passada = isPastReserva(r);

              return (
                <div
                  key={r._id || `${salaId}-${dia}-${horaIni}`}
                  className="card-sala fav-card"
                  onClick={() => abrirDetalhes(r)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={`card-top ${passada ? "ocupada" : "livre"}`}>
                    <span className="statusDot" />
                    <span>{passada ? "Passada" : "Ativa"}</span>
                  </div>

                  <div className="card-body">
                    <div className="sala-info-flex">
                      <div>
                        <div className="sala-nome">Sala {salaId}</div>
                        <div className="sala-meta">
                          {formatDiaBR(dia)} — {horaIni}
                          {horaFim ? `-${horaFim}` : ""} • {pessoas} pessoas
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn-details"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirDetalhes(r);
                      }}
                    >
                      Ver detalhes
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {reservaSelecionada && (
          <ModalDetalhesReserva
            reserva={reservaSelecionada}
            onClose={() => setReservaSelecionada(null)}
          />
        )}
      </main>
    </div>
  );
}
