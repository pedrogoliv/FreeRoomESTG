import React, { useEffect, useMemo, useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import "./detalhesSala.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

/**
 * Se já tens feriados na dashboard, depois trocamos isto por:
 * import { FERIADOS } from "../utils/feriados";
 */
const FERIADOS = [
  // exemplos (YYYY-MM-DD) — mete os teus aqui ou tratamos no backend depois
  // "2026-01-01",
];

function isWeekend(dateStr) {
  if (!dateStr) return false;
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay(); // 0=Dom, 6=Sáb
  return day === 0 || day === 6;
}

function isHoliday(dateStr) {
  if (!dateStr) return false;
  return FERIADOS.includes(dateStr);
}

function toMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== "string") return null;
  const [h, m] = hhmm.split(":").map((x) => Number(x));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function formatDiffMinutes(mins) {
  if (!Number.isFinite(mins) || mins < 0) return "";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export default function DetalhesSala({
  sala,
  onClose,
  isFavorito,
  onToggleFavorito,
  user,
  bloqueado, // continua a existir se tu quiseres bloquear por outros motivos
  onReservaSucesso,
}) {
  if (!sala) return null;

  const capacidade = Number(sala.lugares ?? 0);

  // Dia/Hora dentro do modal
  const [diaSelecionado, setDiaSelecionado] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [horaSelecionada, setHoraSelecionada] = useState("19:00");

  // Status via /api/salas-livres
  const [status, setStatus] = useState("A carregar"); // "Livre" | "Ocupada" | "A carregar"
  const [lugaresDisp, setLugaresDisp] = useState(null);

  // Mensagem “Livre até / Ocupada…”
  const [statusHint, setStatusHint] = useState("");

  const [pessoas, setPessoas] = useState("1");
  const [horaFim, setHoraFim] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Horários (08:00–22:30)
  const horarios = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 22; h++) {
      const hh = String(h).padStart(2, "0");
      slots.push(`${hh}:00`);
      slots.push(`${hh}:30`);
    }
    return slots;
  }, []);

  const opcoesHoraFim = useMemo(() => {
    if (!horaSelecionada) return [];
    return horarios.filter((h) => h > horaSelecionada);
  }, [horarios, horaSelecionada]);

  useEffect(() => {
    setHoraFim(opcoesHoraFim[0] || "");
  }, [opcoesHoraFim]);

  // ✅ Bloqueio por fim-de-semana / feriado
  const bloqueadoDia = isWeekend(diaSelecionado) || isHoliday(diaSelecionado);
  const bloqueadoFinal = Boolean(bloqueado) || bloqueadoDia;

  // Reset mensagens ao mudar sala/dia/hora
  useEffect(() => {
    setMsg("");
  }, [sala?.sala, diaSelecionado, horaSelecionada]);

  async function fetchStatus(dia, hora) {
  const res = await fetch(
    `${API_BASE}/api/salas-livres?dia=${encodeURIComponent(dia)}&hora=${encodeURIComponent(hora)}`
  );

  const data = await res.json().catch(() => []);
  const arr = Array.isArray(data) ? data : [];

  const salaObj = arr.find((s) => String(s.sala) === String(sala.sala));

  const lugares = Number(salaObj.lugaresDisponiveis ?? 0);
  const isLivre = String(salaObj.status).toLowerCase() === "livre" && lugares > 0;

  return { isLivre, lugaresDisponiveis: lugares };
}


  async function calcularHint(dia, hora) {
    setStatusHint("");

    const idx = horarios.findIndex((h) => h === hora);
    if (idx === -1) return;

    const now = await fetchStatus(dia, hora);

    if (now.isLivre) {
      let livreAte = null;
      for (let i = idx + 1; i < horarios.length; i++) {
        const checkHora = horarios[i];
        const st = await fetchStatus(dia, checkHora);
        if (!st.isLivre) {
          livreAte = checkHora;
          break;
        }
      }
      if (!livreAte) livreAte = horarios[horarios.length - 1];
      setStatusHint(`✅ Livre até às ${livreAte}`);
      return;
    }

    let ficaLivreEm = null;
    for (let i = idx + 1; i < horarios.length; i++) {
      const checkHora = horarios[i];
      const st = await fetchStatus(dia, checkHora);
      if (st.isLivre) {
        ficaLivreEm = checkHora;
        break;
      }
    }

    if (!ficaLivreEm) {
      setStatusHint("⛔ Ocupada (sem janelas livres até ao fim do dia)");
      return;
    }

    const diff = toMinutes(ficaLivreEm) - toMinutes(hora);
    const human = formatDiffMinutes(diff);
    setStatusHint(`⛔ Ocupada — fica livre daqui a ${human} (às ${ficaLivreEm})`);
  }

  // Atualizar status/hint quando muda dia/hora/sala
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!diaSelecionado || !horaSelecionada) return;

      // se for fim-de-semana/feriado: não faz sentido chamar API de salas-livres
      if (bloqueadoDia) {
        setStatus("A carregar");
        setLugaresDisp(null);
        setStatusHint("");
        setLoadingStatus(false);
        return;
      }

      setLoadingStatus(true);
      try {
        const st = await fetchStatus(diaSelecionado, horaSelecionada);
        if (cancelled) return;

        if (st.isLivre) {
          setStatus("Livre");
          setLugaresDisp(st.lugaresDisponiveis);
        } else {
          setStatus("Ocupada");
          setLugaresDisp(0);
        }

        await calcularHint(diaSelecionado, horaSelecionada);
      } catch (e) {
        if (!cancelled) {
          setStatus("A carregar");
          setLugaresDisp(null);
          setStatusHint("⚠️ Não consegui obter disponibilidade.");
        }
      } finally {
        if (!cancelled) setLoadingStatus(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [diaSelecionado, horaSelecionada, sala?.sala, bloqueadoDia]);

  const isLivre = status === "Livre";
  const livresAgora = Number(lugaresDisp ?? 0);

  async function reservar() {
    setMsg("");

    if (!diaSelecionado || !horaSelecionada) {
      setMsg("⚠️ Escolhe o dia e a hora.");
      return;
    }

    if (bloqueadoFinal) {
      setMsg("🚫 Reservas indisponíveis para este dia.");
      return;
    }

    const n = Number(String(pessoas).trim());
    if (!Number.isInteger(n) || n < 1) {
      setMsg("⚠️ Nº de pessoas inválido.");
      return;
    }

    if (!horaFim) {
      setMsg("⚠️ Escolhe a hora de fim.");
      return;
    }

    if (!isLivre) {
      setMsg("⚠️ Esta sala não está disponível nesse horário.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reservar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sala: sala.sala,
          dia: diaSelecionado,
          hora_inicio: horaSelecionada,
          hora_fim: horaFim,
          pessoas: n,
          responsavel: user.username
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        onReservaSucesso?.();
      } else {
        setMsg(data.erro || data.message || "❌ Não foi possível reservar.");
      }
    } catch (e) {
      setMsg("❌ O servidor está desligado?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Sala {sala.sala}</h2>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {/* DIA / HORA */}
          <div className="reserva-grid">
            <div>
              <label className="field-label">Dia</label>
              <input
                className="field-control"
                type="date"
                value={diaSelecionado}
                onChange={(e) => setDiaSelecionado(e.target.value)}
              />
            </div>

            <div>
              <label className="field-label">Hora</label>
              <select
                className="field-control"
                value={horaSelecionada}
                onChange={(e) => setHoraSelecionada(e.target.value)}
              >
                {horarios.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {bloqueadoDia && (
            <div className="warning-box">
              <strong>🚫 Reservas indisponíveis</strong>
              <div>Não é possível reservar salas ao fim-de-semana.</div>
            </div>
          )}

          {!bloqueadoDia && (
            <>
              <div className="info-row" style={{ marginTop: 10 }}>
                <span className="info-label">Estado:</span>
                {loadingStatus ? (
                  <span className="status-badge">A verificar...</span>
                ) : isLivre ? (
                  <span className="status-badge livre">Disponível</span>
                ) : (
                  <span className="status-badge ocupada">Ocupada</span>
                )}
              </div>

              {statusHint && <div className="status-hint">{statusHint}</div>}

              <p>
                <strong>Localização:</strong> Piso {sala.piso}
              </p>

              <p>
                <strong>Capacidade:</strong> {capacidade} pessoas
              </p>

              <p>
                <strong>Lugares disponíveis agora:</strong>{" "}
                {loadingStatus ? "..." : livresAgora}
              </p>

              <div className="tags-container">
                <span className="tag">📽️ Projetor</span>
                <span className="tag">❄️ Ar Condicionado</span>
                <span className="tag">🪑 Quadros</span>
              </div>
            </>
          )}

          <div className="modal-actions" style={{ marginTop: 16 }}>
            <div style={{ width: "100%" }}>
              <label className="field-label">Hora fim</label>
              <select
                className="field-control"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                disabled={bloqueadoFinal || !horaSelecionada || opcoesHoraFim.length === 0}
              >
                {opcoesHoraFim.length === 0 ? (
                  <option value="">Sem opções</option>
                ) : (
                  opcoesHoraFim.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))
                )}
              </select>

              <label className="field-label" style={{ marginTop: 10 }}>
                Nº pessoas
              </label>
              <input
                className="field-control"
                type="text"
                inputMode="numeric"
                value={pessoas}
                onChange={(e) => setPessoas(e.target.value.replace(/\D/g, ""))}
                onBlur={() => {
                  const n = Number(pessoas || "1");
                  if (!Number.isInteger(n) || n < 1) setPessoas("1");
                }}
                placeholder="1"
                disabled={bloqueadoFinal}
              />

              <button
                style={{ marginTop: 12 }}
                className="btn-action"
                onClick={reservar}
                disabled={
                  loading ||
                  loadingStatus ||
                  bloqueadoFinal ||
                  !isLivre ||
                  livresAgora <= 0 ||
                  !diaSelecionado ||
                  !horaSelecionada ||
                  !horaFim
                }
              >
                {loading ? "A reservar..." : "Reservar"}
              </button>

              {msg && <div className="msg-box error">{msg}</div>}
            </div>

            <button
              className={`btn-fav ${isFavorito ? "active" : ""}`}
              onClick={onToggleFavorito}
              type="button"
            >
              {isFavorito ? (
                <>
                  <FaHeart className="icon-heart filled" /> Favorito
                </>
              ) : (
                <>
                  <FaRegHeart className="icon-heart outline" /> Adicionar aos Favoritos
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
