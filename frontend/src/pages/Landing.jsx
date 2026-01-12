import { Link } from "react-router-dom";
import "./Landing.css";

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-overlay" />

      <header className="landing-header">
        <div className="landing-brand">
          <div className="landing-logo" aria-hidden="true">▮▮</div>
          <div>
            <div className="landing-title">FreeRoom</div>
            <div className="landing-subtitle">ESTG</div>
          </div>
        </div>
      </header>

      <main className="landing-main">
        {/* ✅ NÃO MEXER: lado esquerdo */}
        <section className="landing-hero">
          <h1>Encontra salas livres</h1>
          <h2>em tempo real</h2>
          <p>
            Disponibilidade por piso, favoritos e reservas rápidas — tudo num só lugar.
          </p>
        </section>

        {/* ✅ NOVO: coluna clean sem card */}
        <aside className="landing-cta" aria-label="Acesso rápido">
          <div className="cta-top">
            <h3>Começar</h3>
            <p>
              Entra para consultar salas, reservar horários e ver a planta da escola.
            </p>

            <div className="cta-actions">
              <Link className="btn-primary" to="/login">Entrar</Link>
              <Link className="btn-secondary" to="/registar">Criar conta</Link>
            </div>
          </div>

          <ul className="cta-list">
            <li><span className="dot" /> Disponibilidade instantânea</li>
            <li><span className="dot" /> Planta da escola</li>
            <li><span className="dot" /> Reservas e histórico</li>
          </ul>

          <div className="cta-footer">
            FreeRoom ESTG • Projeto académico
          </div>
        </aside>
      </main>
    </div>
  );
}
