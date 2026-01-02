// src/pages/Favoritos.jsx
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import DetalhesSala from "../components/detalhesSala"; // Opcional, se quiseres abrir detalhes aqui também
import { FaTrash } from "react-icons/fa"; // Ícone de lixo
import "./Favoritos.css";

export default function Favoritos() {
  const [user, setUser] = useState(null);
  const [favoritosIds, setFavoritosIds] = useState([]);
  const [salasDetalhadas, setSalasDetalhadas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Data e Hora atuais para ver o estado em tempo real
  const hoje = new Date().toISOString().split("T")[0];
  const agora = new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

  const API_BASE = "http://localhost:5000";

  // 1. Ler User do LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // 2. Carregar Favoritos + Estado das Salas
  useEffect(() => {
    if (user && user.username) {
      setLoading(true);

      // A. Buscar lista de IDs favoritos do user
      fetch(`${API_BASE}/api/favoritos/${user.username}`)
        .then((res) => res.json())
        .then((ids) => {
          setFavoritosIds(ids);

          if (ids.length === 0) {
            setLoading(false);
            return;
          }

          // B. Buscar estado ATUAL de todas as salas
          // (Reutilizamos a API que alimenta o Dashboard)
          fetch(`${API_BASE}/api/salas-livres?dia=${hoje}&hora=${agora}`)
            .then((res) => res.json())
            .then((todasSalas) => {
              
              // C. FILTRAR: Ficar apenas com as salas que são favoritas
              const minhasSalas = todasSalas.filter((sala) => 
                ids.includes(sala.sala) || ids.includes(sala.nome)
              );
              
              setSalasDetalhadas(minhasSalas);
              setLoading(false);
            });
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [user]);

  // Função para remover favorito diretamente nesta página
  const removerFavorito = async (salaId) => {
    if (!user) return;

    // Atualização Visual Imediata
    setFavoritosIds((prev) => prev.filter((id) => id !== salaId));
    setSalasDetalhadas((prev) => prev.filter((s) => s.sala !== salaId));

    // Atualização no Backend
    await fetch(`${API_BASE}/api/favoritos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user.username, salaId }),
    });
  };

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Meus Favoritos</h1>
            <p style={{ color: "#64748b" }}>O estado das tuas salas preferidas agora mesmo.</p>
          </div>
        </header>

        {/* MENSAGENS DE ESTADO */}
        {!user && <div className="aviso-box">⚠️ Precisas de fazer login.</div>}
        
        {loading && <p>⏳ A carregar os teus favoritos...</p>}

        {!loading && user && favoritosIds.length === 0 && (
          <div className="empty-state">
            <h3>Ainda não tens favoritos.</h3>
            <p>Vai ao Dashboard e clica no ❤️ nas salas que mais usas!</p>
          </div>
        )}

        {/* GRID DE SALAS FAVORITAS */}
        <div className="grid-salas">
          {salasDetalhadas.map((item) => {
            const isLivre = item.status === "Livre";
            
            return (
              <div key={item.sala} className="card-sala fav-card">
                {/* Cabeçalho do Card */}
                <div className={`card-top ${isLivre ? "livre" : "ocupada"}`}>
                  <span className="statusDot" />
                  <span>{isLivre ? "Disponível" : "Ocupada"}</span>
                </div>

                {/* Corpo do Card */}
                <div className="card-body">
                  <div className="sala-info-flex">
                    <div>
                        <div className="sala-nome">Sala {item.sala}</div>
                        <div className="sala-meta"> Piso {item.piso} • {item.lugares} lug.</div>
                    </div>
                    
                    {/* Botão de Remover Rápido */}
                    <button 
                        className="btn-trash" 
                        title="Remover dos favoritos"
                        onClick={() => removerFavorito(item.sala)}
                    >
                        <FaTrash />
                    </button>
                  </div>
                  
                  {/* Se estiver ocupada, mostra até quando (se houver essa info) */}
                  {!isLivre && item.ate && (
                      <div className="ocupada-ate">
                          Livre às: <strong>{item.ate}</strong>
                      </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}