// src/pages/Mapa.jsx
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { coordenadas } from "../data/mapaCoords"; // Importa as posições
import "./Mapa.css";

export default function Mapa() {
  const [pisoAtivo, setPisoAtivo] = useState(1);
  const [statusSalas, setStatusSalas] = useState({}); // Vai guardar { "S.1.1": "Livre", "S.1.2": "Ocupada" }
  const [loading, setLoading] = useState(true);

  // Data/Hora atuais para a API
  const hoje = new Date().toISOString().split("T")[0];
  const agora = new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

  const API_BASE = "http://localhost:5000";

  // 1. Carregar estado das salas da API
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/salas-livres?dia=${hoje}&hora=${agora}`)
      .then((res) => res.json())
      .then((dados) => {
        // Transformar o array da API num Objeto simples para ser rápido pesquisar
        // Ex: De [{sala: "S.1.1", status: "Livre"}] para { "S.1.1": "Livre" }
        const mapaStatus = {};
        dados.forEach((sala) => {
          mapaStatus[sala.sala] = sala.status; // "Livre" ou "Ocupada"
        });
        
        setStatusSalas(mapaStatus);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        <header className="dashboard-header">
          <h1 className="dashboard-title">Mapa da Escola</h1>
          
          {/* Tabs de Pisos */}
          <div className="tabs">
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                className={`tab ${pisoAtivo === num ? "active" : ""}`}
                onClick={() => setPisoAtivo(num)}
              >
                Piso {num}
              </button>
            ))}
          </div>
        </header>

        {/* ÁREA DO MAPA */}
        <div className="mapa-wrapper">
          {/* Imagem de Fundo (Muda conforme o piso) */}
          {/* Tens de ter as imagens piso1.png, piso2.png na pasta public/assets */}
          <img 
            src={`/assets/piso${pisoAtivo}.png`} 
            alt={`Mapa Piso ${pisoAtivo}`} 
            className="mapa-imagem"
          />

          {/* Renderizar os Pontos (Dots) */}
          {!loading && coordenadas.map((ponto) => {
            // Só mostra os pontos do piso selecionado
            if (ponto.piso !== pisoAtivo) return null;

            const estado = statusSalas[ponto.sala] || "Desconhecido"; // Livre, Ocupada ou ?
            const classeCor = estado === "Livre" ? "dot-livre" : estado === "Ocupada" ? "dot-ocupada" : "dot-neutro";

            return (
              <div
                key={ponto.sala}
                className={`mapa-dot ${classeCor}`}
                style={{ top: ponto.top, left: ponto.left }}
              >
                {/* Tooltip que aparece ao passar o rato */}
                <div className="dot-tooltip">
                  <strong>{ponto.sala}</strong>
                  <br />
                  <span className="dot-status">{estado}</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}