import React, { useEffect, useMemo, useState } from "react";
import { FaHeart, FaRegHeart, FaMapMarkedAlt, FaChevronRight } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
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
  sala, onClose, isFavorito, onToggleFavorito, user, onReservaSucesso,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!sala) return null;

  const {
    diaSelecionado: diaCtx,
    setDiaSelecionado: setDiaCtx,
    horaSelecionada: horaCtx,
    setHoraSelecionada: setHoraCtx
  } = useFiltros();

  const capacidade = Number(sala.lugares ?? 0);

  // ✅ 1. RECUPERAR DADOS GUARDADOS (Se vierem do Mapa)
  // Se 'estadoPreservado' existir (passado pelo Dashboard), usamos esses valores.
  // Caso contrário, usamos os valores normais.
  const dadosSalvos = sala.estadoPreservado || {};

  const [diaSelecionado, setDiaSelecionado] = useState(dadosSalvos.dia || diaCtx);
  const [horaSelecionada, setHoraSelecionada] = useState(dadosSalvos.horaInicio || horaCtx);
  const [pessoas, setPessoas] = useState(dadosSalvos.pessoas || "1");
  const [horaFim, setHoraFim] = useState(dadosSalvos.horaFim || "");
  const [motivo, setMotivo] = useState(dadosSalvos.motivo || "");

  // Atualiza se o contexto mudar externamente (apenas se NÃO tivermos dados salvos específicos)
  useEffect(() => {
    if (!dadosSalvos.dia && diaCtx) setDiaSelecionado(diaCtx);
    if (!dadosSalvos.horaInicio && horaCtx) setHoraSelecionada(horaCtx);
  }, [sala?.sala, diaCtx, horaCtx, dadosSalvos]);

  const [status, setStatus] = useState("A carregar");
  const [lugaresDisp, setLugaresDisp] = useState(null);
  
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const diaLocalBloqueado = isWeekend(diaSelecionado) || isHoliday(diaSelecionado);

  const horarios = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 23; h++) {
      const hh = String(h).padStart(2, "0");
      slots.push(`${hh}:00`);
      if (h < 23) slots.push(`${hh}:30`);
    }

    const hojeStr = new Date().toISOString().split("T")[0];
    if (diaSelecionado === hojeStr) {
      const agora = new Date();
      const horaAtual = agora.getHours();
      const minAtual = agora.getMinutes();

      return slots.filter((slot) => {
        if (slot === "23:00") return false; 
        const [h, m] = slot.split(":").map(Number);
        if (h > horaAtual) return true;
        if (h === horaAtual && m > minAtual) return true;
        return false;
      });
    }
    return slots.filter(s => s !== "23:00");
  }, [diaSelecionado]);

  useEffect(() => {
    // Só reseta a hora se a lista de horários mudar e a atual não for válida
    if (horarios.length > 0 && !horarios.includes(horaSelecionada)) {
      setHoraSelecionada(horarios[0]);
    }
  }, [horarios, horaSelecionada]);

  const opcoesHoraFim = useMemo(() => {
    if (!horaSelecionada) return [];
    
    const slotsFim = [];
    for (let h = 8; h <= 23; h++) {
      const hh = String(h).padStart(2, "0");
      slotsFim.push(`${hh}:00`);
      if (h < 23) slotsFim.push(`${hh}:30`);
    }

    // Filtra apenas para ser maior que o início
    return slotsFim.filter((h) => h > horaSelecionada);
  }, [horaSelecionada]);

  // ✅ Reset inteligente da Hora Fim
  // Antes apagava sempre que o início mudava. Agora só apaga se o fim ficar inválido (menor que o início).
  // Isto impede que a hora fim desapareça quando o componente monta com dados salvos.
  useEffect(() => {
    if (horaFim && horaSelecionada >= horaFim) {
        setHoraFim("");
    }
  }, [horaSelecionada, horaFim]);

  useEffect(() => { setMsg(""); }, [diaSelecionado, horaSelecionada, horaFim]);

  async function fetchStatus(dia, hora) {
    if (!hora) return { isLivre: false, lugaresDisponiveis: 0 };
    const res = await fetch(
      `${API_BASE}/api/salas-livres?dia=${encodeURIComponent(dia)}&hora=${encodeURIComponent(hora)}`
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
      if (diaLocalBloqueado) {
        setStatus("Indisponível"); setLugaresDisp(null); return;
      }
      setLoadingStatus(true);
      try {
        const st = await fetchStatus(diaSelecionado, horaSelecionada);
        if (cancelled) return;
        if (st.isLivre) {
          setStatus("Livre"); setLugaresDisp(st.lugaresDisponiveis);
        } else {
          setStatus("Ocupada"); setLugaresDisp(0);
        }
      } catch (e) {
        if (!cancelled) { setStatus("A carregar"); setLugaresDisp(null); }
      } finally {
        if (!cancelled) setLoadingStatus(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [diaSelecionado, horaSelecionada, sala?.sala, diaLocalBloqueado]);

  const isLivre = status === "Livre";
  const livresAgora = Number(lugaresDisp ?? 0);
  const podeReservar = !diaLocalBloqueado && horarios.length > 0 && !loading && !loadingStatus && isLivre && livresAgora > 0 && horaFim !== "";

  async function reservar() {
    setMsg("");
    if (diaLocalBloqueado) { setMsg("🚫 Dia inválido."); return; }
    if (!diaSelecionado || !horaSelecionada) { setMsg("⚠️ Escolhe o dia e a hora."); return; }
    if (!horaFim) { return; }

    const n = Number(String(pessoas).trim());
    if (!Number.isInteger(n) || n < 1) { setMsg("⚠️ Nº de pessoas inválido."); return; }
    if (!isLivre) { setMsg("⚠️ Indisponível neste horário."); return; }

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
          motivo: motivo
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        onReservaSucesso?.({
          salaNome: `Sala ${sala.sala}`,
          diaISO: diaSelecionado,
          horaInicio: horaSelecionada,
          horaFim: horaFim,
          pessoas: n
        });
      } else {
        setMsg(data.erro || data.message || "❌ Erro ao reservar.");
      }
    } catch (e) {
      setMsg("❌ Erro de ligação.");
    } finally {
      setLoading(false);
    }
  }

  // ✅ 2. FUNÇÃO NOVA: IR PARA O MAPA LEVANDO OS DADOS
  const handleVerMapa = () => {
    navigate("/mapa", {
      state: {
        pisoDestino: Number(sala.piso),
        salaDestino: sala.sala,
        from: location.pathname + location.search,
        scrollY: window.scrollY,
        // ✅ ADICIONA ISTO: Identifica que viemos de um processo de reserva
        origem: "reserva", 
        
        estadoPreservado: {
            dia: diaSelecionado,
            horaInicio: horaSelecionada,
            horaFim: horaFim,
            pessoas: pessoas,
            motivo: motivo
        }
      },
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title-group">
            <h2>Sala {sala.sala}</h2>
            {!diaLocalBloqueado ? (
              loadingStatus ? <span className="status-badge">...</span> : 
              isLivre ? <span className="status-badge livre">Disponível</span> : 
              <span className="status-badge ocupada">Ocupada</span>
            ) : <span className="status-badge ocupada">Fechado</span>}
          </div>
          <div className="header-actions">
            <button className={`btn-header-fav ${isFavorito ? "is-fav" : ""}`} onClick={onToggleFavorito}>
              {isFavorito ? <FaHeart /> : <FaRegHeart />}
            </button>
            <button className="btn-close" onClick={onClose}>&times;</button>
          </div>
        </div>

        <div className="modal-body">
          <div className="form-grid-compact">
            <div className="field-group">
              <label className="field-label">Dia</label>
              <input className="field-control" type="date"
                min={new Date().toISOString().split("T")[0]}
                value={diaSelecionado || ""}
                onChange={(e) => {
                   setDiaSelecionado(e.target.value);
                   setDiaCtx(e.target.value); 
                }}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Pessoas</label>
              <input className="field-control" type="text" inputMode="numeric"
                value={pessoas}
                onChange={(e) => setPessoas(e.target.value.replace(/\D/g, ""))}
                placeholder="1" disabled={diaLocalBloqueado}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Início</label>
              <select className="field-control" value={horaSelecionada || ""}
                onChange={(e) => {
                  setHoraSelecionada(e.target.value);
                  setHoraCtx(e.target.value);
                }}
                disabled={diaLocalBloqueado || horarios.length === 0}
              >
                {horarios.length === 0 && <option disabled>Sem horários</option>}
                {horarios.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Fim</label>
              <select className="field-control" value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                disabled={diaLocalBloqueado || !horaSelecionada || opcoesHoraFim.length === 0}
              >
                <option value="" disabled>-</option>
                {opcoesHoraFim.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="field-group" style={{ gridColumn: "1 / -1" }}>
              <label className="field-label">Motivo (Opcional)</label>
              <input className="field-control" type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                disabled={diaLocalBloqueado}
              />
            </div>
          </div>

          {diaLocalBloqueado && <div className="warning-block">⛔ Selecione um dia útil (Seg-Sex).</div>}
          {horarios.length === 0 && !diaLocalBloqueado && <div className="warning-block">⛔ Não há mais horários disponíveis para hoje.</div>}

          <div className="info-card">
            <div className="info-stats">
              <div className="stat-item"><span className="stat-label">Piso</span><span className="stat-value">{sala.piso}</span></div>
              <div className="stat-item"><span className="stat-label">Capacidade</span><span className="stat-value">{capacidade}</span></div>
              <div className="stat-item"><span className="stat-label">Disponíveis</span><span className="stat-value">{diaLocalBloqueado || horarios.length === 0 ? "-" : (loadingStatus ? "..." : livresAgora)}</span></div>
            </div>
            {/* ✅ 3. APLICAR A FUNÇÃO NO ONCLICK */}
            <div className="map-row" onClick={handleVerMapa}>
              <div className="map-icon"><FaMapMarkedAlt /></div>
              <div className="map-text">Ver localização na planta</div>
              <div className="map-arrow"><FaChevronRight /></div>
            </div>
          </div>

          <div style={{ marginTop: "auto" }}>
            <button className="btn-reservar-main" onClick={reservar} disabled={!podeReservar}>
              {diaLocalBloqueado ? "Indisponível" : (loading ? "A reservar..." : "Reservar")}
            </button>
            {msg && <div className="msg-error">{msg}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}