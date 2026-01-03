import React, { useEffect, useMemo, useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import "./detalhesSala.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function DetalhesSala({
  sala,
  onClose,
  isFavorito,
  onToggleFavorito,

  user,
  diaSelecionado,
  horaSelecionada,
  bloqueado,
  onReservaSucesso,
}) {
  if (!sala) return null;

  const isLivre = sala.status === "Livre";
  const livresAgora = Number(sala.lugaresDisponiveis ?? 0);
  const capacidade = Number(sala.lugares ?? 0);

  const [pessoas, setPessoas] = useState("1");
  const [horaFim, setHoraFim] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const horarios = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 22; h++) {
      const hh = String(h).padStart(2, "0");
      slots.push(`${hh}:00`);
      if (h < 22) slots.push(`${hh}:30`);
    }
    return slots;
  }, []);

  const opcoesHoraFim = useMemo(() => {
    if (!horaSelecionada) return [];
    return horarios.filter((h) => h > horaSelecionada);
  }, [horarios, horaSelecionada]);

  useEffect(() => {
    setMsg("");
    setPessoas("1");
    setHoraFim(opcoesHoraFim[0] || "");
  }, [sala?.sala, diaSelecionado, horaSelecionada, opcoesHoraFim]);

  async function reservar() {
    setMsg("");

    if (!diaSelecionado || !horaSelecionada) {
      setMsg("⚠️ Falta dia/hora. Volta e seleciona no Dashboard.");
      return;
    }

    if (bloqueado) {
      setMsg("⚠️ Reservas indisponíveis para este dia/hora.");
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
          username: user?.username, // útil para "minhas reservas" depois
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
          <div className="info-row">
            <span className="info-label">Estado:</span>
            {isLivre ? (
              <span className="status-badge livre">Disponível</span>
            ) : (
              <span className="status-badge ocupada">Ocupada</span>
            )}
          </div>

          <p>
            <strong>Localização:</strong> Piso {sala.piso}
          </p>

          <p>
            <strong>Capacidade:</strong> {capacidade} pessoas
          </p>
          <p>
            <strong>Lugares disponíveis agora:</strong> {livresAgora}
          </p>

          <div className="tags-container">
            <span className="tag">📽️ Projetor</span>
            <span className="tag">❄️ Ar Condicionado</span>
            <span className="tag">🪑 Quadros</span>
          </div>

          <div className="modal-actions" style={{ marginTop: 16 }}>
            <div style={{ width: "100%" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                Hora fim
              </label>
              <select
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                disabled={bloqueado || !horaSelecionada || opcoesHoraFim.length === 0}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  marginBottom: 12,
                }}
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

              <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                Nº pessoas
              </label>
              <input
                className="input"
                type="text"
                inputMode="numeric"
                value={pessoas}
                onChange={(e) => setPessoas(e.target.value.replace(/\D/g, ""))}
                onBlur={() => {
                  const n = Number(pessoas || "1");
                  if(!Number.isInteger(n) || n < 1) serPessoas("1");
                }}
                placeholder="1"
                disabled={bloqueado}
              />

              <button
                style={{ marginTop: 12 }}
                className="btn-action"
                onClick={reservar}
                disabled={
                  loading ||
                  bloqueado ||
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
