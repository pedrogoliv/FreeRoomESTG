import React, { useEffect, useMemo, useState } from "react";
import { FaHeart, FaRegHeart, FaMapMarkedAlt, FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./detalhesSala.css";
import { useFiltros } from "../context/FiltrosContext.jsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const FERIADOS = [];

function isWeekend(dateStr) {
  if (!dateStr) return false;
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay();
  return day === 0 || day === 6;
}

function isHoliday(dateStr) {
  if (!dateStr) return false;
  return FERIADOS.includes(dateStr);
}

export default function DetalhesSala({
  sala,
  onClose,
  isFavorito,
  onToggleFavorito,
  user,
  bloqueado,
  onReservaSucesso,
}) {
  const navigate = useNavigate();

  if (!sala) return null;

  const {
    diaSelecionado: diaCtx,
    setDiaSelecionado: setDiaCtx,
    horaSelecionada: horaCtx,
    setHoraSelecionada: setHoraCtx,
  } = useFiltros();

  const capacidade = Number(sala.lugares ?? 0);
  const [diaSelecionado, setDiaSelecionado] = useState(diaCtx);
  const [horaSelecionada, setHoraSelecionada] = useState(horaCtx);

  useEffect(() => {
    if (diaCtx) setDiaSelecionado(diaCtx);
    if (horaCtx) setHoraSelecionada(horaCtx);
  }, [sala?.sala, diaCtx, horaCtx]);

  const [status, setStatus] = useState("A carregar");
  const [lugaresDisp, setLugaresDisp] = useState(null);

  const [pessoas, setPessoas] = useState("1");
  const [horaFim, setHoraFim] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const horarios = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 22; h++) {
      const hh = String(h).padStart(2, "0");
      slots.push(`${hh}:00`);
      slots.push(`${hh}:30`);
    }
    return slots;
  }, []);

  // ✅ ALTERAÇÃO AQUI: Limitar a 2 horas (120 min)
  const opcoesHoraFim = useMemo(() => {
    if (!horaSelecionada) return [];

    // Helper interno para converter "08:30" em minutos
    const toMins = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const startMins = toMins(horaSelecionada);

    return horarios.filter((h) => {
      const endMins = toMins(h);
      const diff = endMins - startMins;
      // Só mostra se for depois do início E durar no máximo 120 min (2h)
      return h > horaSelecionada && diff <= 120;
    });
  }, [horarios, horaSelecionada]);

  useEffect(() => {
    // Seleciona automaticamente a primeira opção válida (ex: 30 min depois)
    setHoraFim(opcoesHoraFim[0] || "");
  }, [opcoesHoraFim]);

  const bloqueadoDia = isWeekend(diaSelecionado) || isHoliday(diaSelecionado);
  const bloqueadoFinal = Boolean(bloqueado) || bloqueadoDia;

  useEffect(() => { setMsg(""); }, [sala?.sala, diaSelecionado, horaSelecionada]);

  async function fetchStatus(dia, hora) {
    const res = await fetch(
      `${API_BASE}/api/salas-livres?dia=${encodeURIComponent(
        dia
      )}&hora=${encodeURIComponent(hora)}`
    );

    const data = await res.json().catch(() => []);
    const arr = Array.isArray(data) ? data : [];
    const salaObj = arr.find((s) => String(s.sala) === String(sala.sala));
    const lugares = Number(salaObj?.lugaresDisponiveis ?? 0);
    const isLivre = String(salaObj?.status).toLowerCase() === "livre" && lugares > 0;
    return { isLivre, lugaresDisponiveis: lugares };
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!diaSelecionado || !horaSelecionada) return;
      if (bloqueadoDia) {
        setStatus("A carregar");
        setLugaresDisp(null);
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
      } catch (e) {
        if (!cancelled) {
          setStatus("A carregar");
          setLugaresDisp(null);
        }
      } finally {
        if (!cancelled) setLoadingStatus(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [diaSelecionado, horaSelecionada, sala?.sala, bloqueadoDia]);

  const isLivre = status === "Livre";
  const livresAgora = Number(lugaresDisp ?? 0);

  async function reservar() {
    setMsg("");
    if (!diaSelecionado || !horaSelecionada) { setMsg("⚠️ Escolhe o dia e a hora."); return; }
    if (bloqueadoFinal) { setMsg("🚫 Reservas indisponíveis para este dia."); return; }
    const n = Number(String(pessoas).trim());
    if (!Number.isInteger(n) || n < 1) { setMsg("⚠️ Nº de pessoas inválido."); return; }
    if (!horaFim) { setMsg("⚠️ Escolhe a hora de fim."); return; }
    if (!isLivre) { setMsg("⚠️ Esta sala não está disponível nesse horário."); return; }

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
          responsavel: user?.username,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { onReservaSucesso?.(); }
      else { setMsg(data.erro || data.message || "❌ Não foi possível reservar."); }
    } catch (e) { setMsg("❌ O servidor está desligado?"); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="modal-header">
          <div className="header-title-group">
            <h2>Sala {sala.sala}</h2>
            
            {!bloqueadoDia && (
              <>
                {loadingStatus ? (
                  <span className="status-badge">...</span>
                ) : isLivre ? (
                  <span className="status-badge livre">Disponível</span>
                ) : (
                  <span className="status-badge ocupada">Ocupada</span>
                )}
              </>
            )}
            {bloqueadoDia && <span className="status-badge ocupada">Indisponível</span>}
          </div>
          
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          
          {bloqueadoDia && (
            <div className="warning-box">
              <strong>Fim-de-semana/Feriado</strong>
              <div>Não é possível reservar.</div>
            </div>
          )}

          {/* INPUTS 1: DIA e PESSOAS */}
          <div className="reserva-grid">
            <div>
              <label className="field-label">Dia</label>
              
              {/* ✅ INPUT DATA SIMPLES E NATIVO */}
              <input
                className="field-control"
                type="date"
                value={diaSelecionado || ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) { setDiaSelecionado(v); setDiaCtx(v); }
                }}
              />

            </div>
            
            <div>
              <label className="field-label">Nº Pessoas</label>
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
            </div>
          </div>

          {/* INPUTS 2: HORAS */}
          <div className="reserva-grid">
            <div>
              <label className="field-label">Das</label>
              <select
                className="field-control"
                value={horaSelecionada || ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setHoraSelecionada(v);
                  setHoraCtx(v);
                }}
              >
                {horarios.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">Até às</label>
              <select
                className="field-control"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                disabled={bloqueadoFinal || !horaSelecionada || opcoesHoraFim.length === 0}
              >
                {opcoesHoraFim.length === 0 ? <option value="">-</option> : opcoesHoraFim.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          {/* INFO COMPACTA */}
          {!bloqueadoDia && (
            <div className="compact-info-section">
              <div className="info-grid-row">
                <p><strong>Piso:</strong> {sala.piso}</p>
                <p><strong>Capacidade:</strong> {capacidade}</p>
                <p><strong>Livres:</strong> {loadingStatus ? "..." : livresAgora}</p>
              </div>

              <div 
                className="map-link-card small" 
                onClick={() => {
                  navigate("/mapa", { state: { pisoDestino: sala.piso } });
                }}
              >
                <div className="map-icon-box"><FaMapMarkedAlt /></div>
                <div className="map-link-text">
                  <strong>Ver na Planta</strong>
                </div>
                <FaChevronRight className="chevron-icon" />
              </div>
            </div>
          )}

          {/* BOTÕES */}
          <div className="modal-actions" style={{ marginTop: 10 }}>
              <button
                className="btn-action"
                onClick={reservar}
                disabled={loading || loadingStatus || bloqueadoFinal || !isLivre || livresAgora <= 0 || !diaSelecionado || !horaSelecionada || !horaFim}
              >
                {loading ? "A reservar..." : "Reservar"}
              </button>

              {msg && <div className="msg-box error">{msg}</div>}

              <button
                className={`btn-fav ${isFavorito ? "active" : ""}`}
                onClick={onToggleFavorito}
                type="button"
              >
                {isFavorito ? (
                  <> <FaHeart className="icon-heart filled" /> Favorito </>
                ) : (
                  <> <FaRegHeart className="icon-heart outline" /> Favorito </>
                )}
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}