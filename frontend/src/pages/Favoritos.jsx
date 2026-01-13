import { useEffect, useState } from "react";
// ✅ 1. Importar hooks de navegação
import { useLocation, useNavigate } from "react-router-dom"; 
import Sidebar from "../components/Sidebar";
import DetalhesSala from "../components/detalhesSala";
import "./Favoritos.css";

export default function Favoritos() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  
  // ✅ 2. Instanciar hooks
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [favoritosIds, setFavoritosIds] = useState([]);
  const [loadingFav, setLoadingFav] = useState(true);

  // Estado para notificação UNDO
  const [undoToast, setUndoToast] = useState(null);

  // Modal
  const [salaSelecionada, setSalaSelecionada] = useState(null);
  const [loadingSala, setLoadingSala] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

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

  // Função para descobrir o piso pelo nome (ex: A.2.1 -> 2)
  function getPisoFromNome(nomeSala) {
    if (!nomeSala) return "1";
    const match = nomeSala.match(/\.(\d+)\./);
    if (match && match[1]) return match[1];
    return "1";
  }

  // Função de remover com Undo
  async function toggleFavorito(salaId) {
    if (!user?.username) return;
    const sid = String(salaId);
    
    const isRemoving = favoritosIds.includes(sid);

    setFavoritosIds((prev) => {
      if (prev.includes(sid)) return prev.filter((id) => id !== sid);
      return [...prev, sid];
    });

    if (undoToast?.timeoutId) clearTimeout(undoToast.timeoutId);
    
    const timer = setTimeout(() => {
      setUndoToast(null);
    }, 4000);

    if (isRemoving) {
      setUndoToast({
        show: true,
        type: 'remove',
        salaId: sid,
        text: 'Removido dos favoritos.',
        timeoutId: timer
      });
    } else {
      setUndoToast({
        show: true,
        type: 'add',
        salaId: sid,
        text: 'Adicionado aos favoritos!',
        timeoutId: timer
      });
    }

    try {
      await fetch(`${API_BASE}/api/favoritos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, salaId: sid }),
      });
    } catch (e) {
      console.error(e);
      setMsg("❌ Erro ao atualizar favorito.");
    }
  }

  const handleUndo = () => {
    if (!undoToast || undoToast.type !== 'remove') return;
    toggleFavorito(undoToast.salaId);
    setUndoToast(null);
  };

  function getNowDiaHoraSlot() {
    const now = new Date();
    const dia = now.toISOString().split("T")[0];
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = now.getMinutes() < 30 ? "00" : "30";
    const hora = `${hh}:${mm}`;
    return { dia, hora };
  }

  async function abrirDetalhes(idSala) {
    setMsg("");
    setLoadingSala(true);

    const pisoCalculado = getPisoFromNome(idSala);

    try {
      const { dia, hora } = getNowDiaHoraSlot();
      const res = await fetch(
        `${API_BASE}/api/salas-livres?dia=${encodeURIComponent(dia)}&hora=${encodeURIComponent(hora)}`
      );
      const data = await res.json().catch(() => []);
      const arr = Array.isArray(data) ? data : [];
      const salaObj = arr.find((s) => String(s.sala) === String(idSala));

      setSalaSelecionada({
        sala: String(idSala),
        piso: salaObj?.piso || pisoCalculado,
        lugares: salaObj?.lugares ?? 15,
      });
    } catch (e) {
      setSalaSelecionada({
        sala: String(idSala),
        piso: pisoCalculado,
        lugares: 15,
      });
      setMsg("⚠️ Info atualizada indisponível, a usar dados locais.");
    } finally {
      setLoadingSala(false);
    }
  }

  // ✅ 3. LÓGICA PARA REABRIR A SALA AO VOLTAR DO MAPA
  useEffect(() => {
    if (location.state?.reabrirSala) {
      const nomeSala = location.state.reabrirSala;
      const estadoQueVoltou = location.state.reabrirComEstado;

      // Mesmo que ainda não tenhamos carregado tudo, podemos reconstruir o objeto básico da sala
      const pisoProvavel = getPisoFromNome(nomeSala);
      
      setSalaSelecionada({
        sala: nomeSala,
        piso: pisoProvavel,
        lugares: 15, // Valor temporário até carregar, ou mantido se for fallback
        estadoPreservado: estadoQueVoltou // ✅ Injeta os dados do formulário
      });

      // Limpa o estado da navegação
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        <header className="dashboard-header">
          <div><h1 className="dashboard-title">Meus Favoritos</h1></div>
        </header>

        {msg && <div style={{ marginBottom: 14, color: "#b91c1c" }}>{msg}</div>}

        {loadingFav ? (
          <p>⏳ A carregar favoritos...</p>
        ) : favoritosIds.length === 0 ? (
          <div className="empty-state">
            <h3>Ainda não tens favoritos.</h3>
            <p>Adiciona salas aos favoritos na página inicial.</p>
          </div>
        ) : (
          <div className="grid-salas">
            {favoritosIds.map((id) => {
              const pisoVisual = getPisoFromNome(id); 

              return (
                <div key={id} className="card-sala fav-card" onClick={() => abrirDetalhes(id)}>
                  <div className="card-top livre">
                    <span className="statusDot" />
                    <span>Favorito</span>
                  </div>

                  <div className="card-body">
                    <div className="card-header-row">
                      <div className="sala-nome">Sala {id}</div>
                      <span className="sala-piso-badge">🏢 Piso {pisoVisual}</span>
                    </div>
                    
                    <div style={{ marginTop: "15px" }}>
                      <button
                        className="btn-details"
                        disabled={loadingSala}
                      >
                        {loadingSala ? "A carregar..." : "Ver detalhes"}
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {undoToast && undoToast.show && (
          <div className={`undo-toast ${undoToast.type === "add" ? "success" : ""}`}>
            <span>
              {undoToast.type === "add" ? "✅ " : "🗑️ "} 
              {undoToast.text}
            </span>
            
            {undoToast.type === "remove" && (
              <button className="undo-btn" onClick={handleUndo}>
                Desfazer
              </button>
            )}
          </div>
        )}

        {salaSelecionada && (
          <DetalhesSala
            sala={salaSelecionada}
            onClose={() => setSalaSelecionada(null)}
            isFavorito={favoritosIds.includes(String(salaSelecionada.sala))}
            onToggleFavorito={() => toggleFavorito(salaSelecionada.sala)}
            user={user}
            bloqueado={false}
            onReservaSucesso={() => setSalaSelecionada(null)}
          />
        )}
      </main>
    </div>
  );
}