import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { coordenadas } from "../data/mapaCoords";
import "./Mapa.css";

export default function Mapa() {
  const location = useLocation();

  const [pisoAtivo, setPisoAtivo] = useState(Number(location.state?.pisoDestino) || 1);

  const [statusSalas, setStatusSalas] = useState({});
  const [loading, setLoading] = useState(true);

  const hoje = new Date().toISOString().split("T")[0];
  const agora = new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/salas-livres?dia=${hoje}&hora=${agora}`)
      .then((res) => res.json())
      .then((dados) => {
        const mapaStatus = {};
        if (Array.isArray(dados)) {
          dados.forEach((sala) => {
            mapaStatus[sala.sala] = sala.status;
          });
        }
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
          <h1 className="dashboard-title">Planta da Escola</h1>
          
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

        <div className="mapa-wrapper">
          {/* Certifica-te que as imagens estão em /public/assets/piso1.svg, etc. */}
          <img 
            src={`/assets/piso${pisoAtivo}.svg`} 
            alt={`Mapa Piso ${pisoAtivo}`} 
            className="mapa-imagem"
          />

          {!loading && coordenadas.map((ponto) => {
            // Filtra pelo piso ativo
            if (Number(ponto.piso) !== pisoAtivo) return null;

            const estado = statusSalas[ponto.sala] || "Desconhecido";
            const classeCor = estado === "Livre" ? "dot-livre" : estado === "Ocupada" ? "dot-ocupada" : "dot-neutro";

            return (
              <div
                key={ponto.sala}
                className={`mapa-dot ${classeCor}`}
                style={{ top: ponto.top, left: ponto.left }}
              >
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