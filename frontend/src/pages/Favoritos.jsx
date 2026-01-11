import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import DetalhesSala from "../components/detalhesSala";
import "./Favoritos.css";

export default function Favoritos() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const [user, setUser] = useState(null);
  const [favoritosIds, setFavoritosIds] = useState([]);
  const [loadingFav, setLoadingFav] = useState(true);

  // ✅ ESTADO PARA NOTIFICAÇÃO UNDO
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

  // ✅ FUNÇÃO DE REMOVER COM UNDO (Lógica igual ao Dashboard)
  async function toggleFavorito(salaId) {
    if (!user?.username) return;
    const sid = String(salaId);
    
    // Verifica se estamos a remover (nesta página é quase sempre remover, mas convém verificar)
    const isRemoving = favoritosIds.includes(sid);

    // Atualiza a lista visualmente
    setFavoritosIds((prev) => {
      if (prev.includes(sid)) return prev.filter((id) => id !== sid);
      return [...prev, sid];
    });

    // Gere a notificação
    if (undoToast?.timeoutId) clearTimeout(undoToast.timeoutId);
    
    const timer = setTimeout(() => {
      setUndoToast(null);
    }, 4000);

    if (isRemoving) {
      // ✅ Mostra aviso de remoção com botão UNDO
      setUndoToast({
        show: true,
        type: 'remove',
        salaId: sid,
        text: 'Removido dos favoritos.',
        timeoutId: timer
      });
    } else {
      // ✅ Mostra aviso de adição (caso faças Undo)
      setUndoToast({
        show: true,
        type: 'add',
        salaId: sid,
        text: 'Adicionado aos favoritos!',
        timeoutId: timer
      });
    }

    // Chama API
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

  // ✅ FUNÇÃO DESFAZER
  const handleUndo = () => {
    if (!undoToast || undoToast.type !== 'remove') return;

    // Volta a adicionar a sala
    toggleFavorito(undoToast.salaId);
    
    // Fecha o aviso imediatamente
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
            <h3>⭐ Ainda não tens favoritos</h3>
            <p>Vai ao Dashboard e adiciona salas aos favoritos.</p>
          </div>
        ) : (
          <div className="grid-salas">
            {favoritosIds.map((id) => {
              const pisoVisual = getPisoFromNome(id); 

              return (
                <div key={id} className="card-sala fav-card" onClick={() => abrirDetalhes(id)}>
                  {/* Topo Verde */}
                  <div className="card-top livre">
                    <span className="statusDot" />
                    <span>Favorito</span>
                  </div>

                  <div className="card-body">
                    
                    {/* Nome à esquerda, Piso à direita */}
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

        {/* ✅ COMPONENTE VISUAL DA NOTIFICAÇÃO (Igual ao Dashboard) */}
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