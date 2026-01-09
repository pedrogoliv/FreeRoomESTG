import { useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { coordenadas } from "../data/mapaCoords";
import "./Mapa.css";

export default function Mapa() {
  const location = useLocation();
  const [pisoAtivo, setPisoAtivo] = useState(Number(location.state?.pisoDestino) || 1);

  // sala destino
  const salaDestinoRaw =
    location.state?.salaDestino || location.state?.sala || location.state?.nomeSala || "";
  const salaDestino = useMemo(() => String(salaDestinoRaw || "").trim(), [salaDestinoRaw]);

  // Entrada fixa 
  const ENTRADA = useMemo(
    () => ({ piso: 1, top: "59%", left: "31%" }),
    []
  );

  // procura coords
  const pontoDestino = useMemo(() => {
    if (!salaDestino) return null;
    return (
      coordenadas.find(
        (p) => String(p.sala).trim() === salaDestino && Number(p.piso) === Number(pisoAtivo)
      ) || null
    );
  }, [salaDestino, pisoAtivo]);

  const showMissingWarning = Boolean(salaDestino) && !pontoDestino;

  return (
    // ADICIONEI "page-mapa" AQUI 👇
    <div className="dashboard-container page-mapa">
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
          <img
            src={`/assets/piso${pisoAtivo}.svg`}
            alt={`Mapa Piso ${pisoAtivo}`}
            className="mapa-imagem"
          />

          {/* PONTO ENTRADA */}
          {pisoAtivo === ENTRADA.piso && (
            <div
              className="mapa-dot dot-entrada"
              style={{ top: ENTRADA.top, left: ENTRADA.left }}
            >
              <div className="dot-tooltip">
                <strong>ENTRADA</strong>
              </div>
            </div>
          )}

          {/* PONTO DESTINO */}
          {pontoDestino && (
            <div
              className="mapa-dot dot-destino"
              style={{ top: pontoDestino.top, left: pontoDestino.left }}
            >
              <div className="dot-tooltip">
                <strong>{pontoDestino.sala}</strong>
                <span className="dot-status">DESTINO</span>
              </div>
            </div>
          )}

          {showMissingWarning && (
            <div className="mapa-warning">
              Não há coordenadas para <strong>{salaDestino}</strong> no Piso{" "}
              <strong>{pisoAtivo}</strong>.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}