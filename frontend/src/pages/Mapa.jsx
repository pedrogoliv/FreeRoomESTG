import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { coordenadas } from "../data/mapaCoords";
import "./Mapa.css";

export default function Mapa() {
  const location = useLocation();
  const navigate = useNavigate();

  const [pisoAtivo, setPisoAtivo] = useState(Number(location.state?.pisoDestino) || 1);

  const salaDestinoRaw =
    location.state?.salaDestino || location.state?.sala || location.state?.nomeSala || "";
    
  const salaDestino = useMemo(() => String(salaDestinoRaw || "").trim(), [salaDestinoRaw]);

  const isReservaFlow = location.state?.origem === "reserva";

  const handleVoltar = () => {
    const from = location.state?.from;
    const estadoPreservado = location.state?.estadoPreservado; 

    if (from && isReservaFlow) {
      navigate(from, { state: { reabrirSala: salaDestinoRaw, reabrirComEstado: estadoPreservado } });
    } else {
      navigate(-1);
    }
  };

  const ENTRADA = useMemo(() => ({ piso: 1, top: "59%", left: "31%" }), []);

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
    <div className="dashboard-container page-mapa">
      <Sidebar />

      <main className="main-content">
        <header className="dashboard-header">
          <div className="header-left-actions">
            {isReservaFlow && (
              <button className="mapa-back" onClick={handleVoltar}>← Voltar</button>
            )}
          </div>

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
          <div className="mapa-escala">
            
            <img
              src={`/assets/piso${pisoAtivo}.svg`}
              alt={`Mapa Piso ${pisoAtivo}`}
              className="mapa-imagem"
            />

            {pisoAtivo === ENTRADA.piso && (
              <div className="mapa-dot dot-entrada" style={{ top: ENTRADA.top, left: ENTRADA.left }}>
                <div className="dot-tooltip"><strong>ENTRADA</strong></div>
              </div>
            )}

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

          </div>
        </div>

        {showMissingWarning && (
            <div className="mapa-warning">
               A sala <strong>{salaDestino}</strong> não se encontra no piso <strong>{pisoAtivo}</strong>.
            </div>
        )}

      </main>
    </div>
  );
}