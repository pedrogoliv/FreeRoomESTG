// src/pages/Favoritos.jsx
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import DetalhesSala from "../components/detalhesSala";
import { FaTrash } from "react-icons/fa";
import "./Favoritos.css";

export default function Favoritos() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const [user, setUser] = useState(null);

  // Lista de IDs das salas favoritas
  const [favoritosIds, setFavoritosIds] = useState([]);
  const [loadingFav, setLoadingFav] = useState(true);

  // Modal
  const [salaSelecionada, setSalaSelecionada] = useState(null);
  const [loadingSala, setLoadingSala] = useState(false);
  const [msg, setMsg] = useState("");

  // ler user do storage
  useEffect(() => {
    const stored =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // buscar favoritos
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
      setMsg("❌ Erro ao atualizar favoritos.");
    }
  }

  function getNowDiaHoraSlot() {
    const now = new Date();
    const dia = now.toISOString().split("T")[0];

    const hh = String(now.getHours()).padStart(2, "0");
    const mm = now.getMinutes() < 30 ? "00" : "30"; // arredonda para slots
    const hora = `${hh}:${mm}`;

    return { dia, hora };
  }

  // Ao clicar numa sala favorita: abrir modal (dia/hora passam para dentro do DetalhesSala)
  async function abrirDetalhes(idSala) {
    setMsg("");
    setLoadingSala(true);

    try {
      // buscar piso/lugares reais usando o endpoint da dashboard (com data/hora atuais)
      const { dia, hora } = getNowDiaHoraSlot();

      const res = await fetch(
        `${API_BASE}/api/salas-livres?dia=${encodeURIComponent(
          dia
        )}&hora=${encodeURIComponent(hora)}`
      );
      const data = await res.json().catch(() => []);
      const arr = Array.isArray(data) ? data : [];

      const salaObj = arr.find((s) => String(s.sala) === String(idSala));

      setSalaSelecionada({
        sala: String(idSala),
        piso: salaObj?.piso ?? "-",
        lugares: salaObj?.lugares ?? salaObj?.capacidade ?? 15,
      });
    } catch (e) {
      // fallback (não bloqueia o modal)
      setSalaSelecionada({
        sala: String(idSala),
        piso: "-",
        lugares: 15,
      });
      setMsg("⚠️ Não consegui carregar piso/capacidade desta sala.");
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
              Clica numa sala favorita para ver detalhes e reservar.
            </p>
          </div>
        </header>

        {msg && (
          <div style={{ marginBottom: 14, color: "#b91c1c" }}>{msg}</div>
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
                        Clique para reservar (data/hora no detalhe)
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
                    {loadingSala ? "A abrir..." : "Ver detalhes"}
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
            bloqueado={false}
            onReservaSucesso={() => setSalaSelecionada(null)}
          />
        )}
      </main>
    </div>
  );
}
