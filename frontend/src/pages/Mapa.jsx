import { useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { coordenadas } from "../data/mapaCoords";
import "./Mapa.css";

export default function Mapa() {
  const location = useLocation();
  console.log("MAPA state:", location.state);

  const [pisoAtivo, setPisoAtivo] = useState(Number(location.state?.pisoDestino) || 1);

  // sala destino (vem do navigate)
  const salaDestinoRaw =
    location.state?.salaDestino || location.state?.sala || location.state?.nomeSala || "";
  const salaDestino = useMemo(() => String(salaDestinoRaw || "").trim(), [salaDestinoRaw]);

  // Entrada fixa 
  const ENTRADA = useMemo(
    () => ({
      piso: 1,
      top: "59%",
      left: "31%",
    }),
    []
  );

  // procura coords da sala destino no piso ativo 
  const pontoDestino = useMemo(() => {
    if (!salaDestino) return null;

    return (
      coordenadas.find(
        (p) =>
          String(p.sala).trim() === salaDestino && Number(p.piso) === Number(pisoAtivo)
      ) || null
    );
  }, [salaDestino, pisoAtivo]);

  // aviso quando a sala não existe no mapaCoords para esse piso
  const showMissingWarning = Boolean(salaDestino) && !pontoDestino;

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
          <img
            src={`/assets/piso${pisoAtivo}.svg`}
            alt={`Mapa Piso ${pisoAtivo}`}
            className="mapa-imagem"
          />

          {pisoAtivo === ENTRADA.piso && (
            <div
              className="mapa-dot dot-entrada"
              style={{ top: ENTRADA.top, left: ENTRADA.left }}
              title="Entrada"
            >
              <div className="dot-tooltip">
                <strong>Entrada</strong>
              </div>
            </div>
          )}

          {pontoDestino && (
            <div
              className="mapa-dot dot-destino"
              style={{ top: pontoDestino.top, left: pontoDestino.left }}
              title={pontoDestino.sala}
            >
              <div className="dot-tooltip">
                <strong>{pontoDestino.sala}</strong>
                <br />
                <span className="dot-status">Destino</span>
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
