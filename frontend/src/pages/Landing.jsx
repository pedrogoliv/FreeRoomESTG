import { Link } from "react-router-dom";
import "./Landing.css";

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-overlay" />

      {/* topo esquerdo: marca */}
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
        {/* lado esquerdo (limpo): slogan curto, sem “caixa” */}
        <section className="landing-hero">
          <h1>Encontra salas livres</h1>
          <h2>em tempo real</h2>
          <p>
            Disponibilidade por piso, favoritos e reservas rápidas — tudo num só lugar.
          </p>
        </section>

        {/* painel direito (do topo ao fundo) */}
        <aside className="landing-panel" aria-label="Acesso rápido">
          <div className="panel-content">
            <h3>Começar</h3>
            <p className="panel-text">
              Entra para consultar salas, reservar horários e ver a planta da escola.
            </p>

            <div className="panel-actions">
              <Link className="btn-primary" to="/login">Entrar</Link>
              <Link className="btn-secondary" to="/registar">Criar conta</Link>
            </div>

            <div className="panel-divider" />

            <ul className="panel-list">
              <li><span className="dot" /> Disponibilidade instantânea</li>
              <li><span className="dot" /> Planta da escola</li>
              <li><span className="dot" /> Reservas e histórico</li>
            </ul>

            <div className="panel-footer">
              FreeRoom ESTG • Projeto académico
            </div>
          </div>
        </aside>
      </main>

      {/* footer só para mobile (no desktop o texto vai no painel) */}
      <footer className="landing-footer-mobile">
        <span>FreeRoom ESTG • Projeto académico</span>
      </footer>
    </div>
  );
}
