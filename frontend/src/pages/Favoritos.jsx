// src/pages/Favoritos.jsx
import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import DetalhesSala from "../components/detalhesSala";
import { FaTrash } from "react-icons/fa";
import "./Favoritos.css";

export default function Favoritos() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const [user, setUser] = useState(null);

  // Lista de IDs das salas favoritas (ex: ["B106", "A203"])
  const [favoritosIds, setFavoritosIds] = useState([]);
  const [loadingFav, setLoadingFav] = useState(true);

  // Dia/hora para reservar (não bloqueia fins-de-semana)
  const [diaSelecionado, setDiaSelecionado] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [horaSelecionada, setHoraSelecionada] = useState("19:00");

  // Modal
  const [salaSelecionada, setSalaSelecionada] = useState(null);
  const [loadingSala, setLoadingSala] = useState(false);
  const [msg, setMsg] = useState("");

  // horários (08:00–22:30)
  const listaHorarios = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 22; h++) {
      const hh = String(h).padStart(2, "0");
      slots.push(`${hh}:00`);
      if (h < 22) slots.push(`${hh}:30`);
    }
    return slots;
  }, []);

  // 1) ler user do storage
  useEffect(() => {
    const stored = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // 2) buscar favoritos SEMPRE (independente do dia/hora)
  useEffect(() => {
    if (!user?.username) return;

    setLoadingFav(true);
    fetch(`${API_BASE}/api/favoritos/${user.username}`)
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setFavoritosIds(arr.map((x) => String(x)));
      })
      .catch(() => setFavoritosIds([]))
      .finally(() => setLoadingFav(false));
  }, [user, API_BASE]);

  // Remover favorito (toggle no backend)
  async function removerFavorito(salaId) {
    if (!user?.username) return;

    const sid = String(salaId);

    // UI otimista
    setFavoritosIds((prev) => prev.filter((id) => String(id) !== sid));

    try {
      await fetch(`${API_BASE}/api/favoritos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, salaId: sid }),
      });
    } catch (e) {
      setFavoritosIds((prev) => (prev.includes(sid) ? prev : [...prev, sid]));
    }
  }

  // Ao clicar numa sala favorita: buscar detalhes para o dia/hora escolhidos e abrir modal
  async function abrirDetalhes(idSala) {
    setMsg("");
    setLoadingSala(true);

    try {
      const res = await fetch(
        `${API_BASE}/api/salas-livres?dia=${encodeURIComponent(
          diaSelecionado
        )}&hora=${encodeURIComponent(horaSelecionada)}`
      );

      const data = await res.json().catch(() => []);
      const arr = Array.isArray(data) ? data : [];

      const salaObj = arr.find((s) => String(s.sala) === String(idSala));

      if (!salaObj) {
        setSalaSelecionada({
          sala: String(idSala),
          piso: "-",
          lugares: 15,
          status: "Livre",
          lugaresDisponiveis: 15,
        });
        setMsg("⚠️ Não consegui obter detalhes desta sala para esse horário.");
      } else {
        setSalaSelecionada(salaObj);
      }
    } catch (e) {
      setMsg("❌ Erro ao ligar ao servidor.");
    } finally {
      setLoadingSala(false);
    }
  }

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Meus Favoritos</h1>
            <p style={{ color: "#64748b" }}>
              Clica numa sala favorita para reservar no dia/hora selecionados.
            </p>
          </div>

          <div className="filters">
            <div className="filtro-box">
              <label>DIA</label>
              <input
                type="date"
                value={diaSelecionado}
                onChange={(e) => setDiaSelecionado(e.target.value)}
              />
            </div>

            <div className="filtro-box">
              <label>HORA</label>
              <select
                value={horaSelecionada}
                onChange={(e) => setHoraSelecionada(e.target.value)}
              >
                {listaHorarios.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {msg && (
          <div style={{ marginBottom: 14, color: "#b91c1c" }}>
            {msg}
          </div>
        )}

        {loadingFav ? (
          <p>⏳ A carregar favoritos...</p>
        ) : favoritosIds.length === 0 ? (
          <div className="empty-state">
            <h3>⭐ Ainda não tens favoritos</h3>
            <p>Vai ao Dashboard e adiciona salas aos favoritos.</p>
          </div>
        ) : (
          <div className="grid-salas">
            {favoritosIds.map((id) => (
              <div
                key={id}
                className="card-sala fav-card"
                onClick={() => abrirDetalhes(id)}
                role="button"
                tabIndex={0}
              >
                <div className="card-top livre">
                  <span className="statusDot" />
                  <span>Favorito</span>
                </div>

                <div className="card-body">
                  <div className="sala-info-flex">
                    <div>
                      <div className="sala-nome">Sala {id}</div>
                      <div className="sala-meta">
                        Reservar para {diaSelecionado} • {horaSelecionada}
                      </div>
                    </div>

                    <button
                      className="btn-trash"
                      title="Remover dos favoritos"
                      onClick={(e) => {
                        e.stopPropagation();
                        removerFavorito(id);
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>

                  <button
                    className="btn-details"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      abrirDetalhes(id);
                    }}
                    disabled={loadingSala}
                  >
                    {loadingSala ? "A abrir..." : "Abrir / Reservar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {salaSelecionada && (
          <DetalhesSala
            sala={salaSelecionada}
            onClose={() => setSalaSelecionada(null)}
            isFavorito={favoritosIds.includes(String(salaSelecionada.sala))}
            onToggleFavorito={() => removerFavorito(salaSelecionada.sala)}
            user={user}
            diaSelecionado={diaSelecionado}
            horaSelecionada={horaSelecionada}
            bloqueado={false} 
            onReservaSucesso={() => {
              setSalaSelecionada(null);
            }}
          />
        )}
      </main>
    </div>
  );
}
