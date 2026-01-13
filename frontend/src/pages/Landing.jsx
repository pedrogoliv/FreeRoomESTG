import { Link } from "react-router-dom";
import { FaCheckCircle, FaArrowRight, FaUserPlus } from "react-icons/fa";
import "./Landing.css";

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-overlay" />



      <main className="landing-main">
        {/* LADO ESQUERDO */}
        <section className="landing-hero">
          
          {/* ✅ NOVO: Logo Grande Branco Hero */}
          <div className="hero-brand">
            <img src="/livro512x512.png" alt="Livro FreeRoom" className="hero-icon" />
            <div className="hero-text-stack">
              <span className="hero-title">FreeRoom</span>
              <span className="hero-badge">ESTG</span>
            </div>
          </div>

          <h1>
            Encontra salas livres <br />
            <span className="text-gradient">em tempo real</span>
          </h1>
          <p>
            Nunca mais percas tempo à procura de um sítio para estudar. 
          </p>
        </section>

        {/* LADO DIREITO (CARD DE VIDRO) - Mantido igual */}
        <aside className="landing-panel">
          <div className="panel-content">
            <h3>Começar agora</h3>
            <p className="panel-text">
              Acede à plataforma para consultar horários e garantir o teu lugar.
            </p>

            <div className="panel-actions">
              <Link className="btn-primary" to="/login">
                Entrar <FaArrowRight style={{ marginLeft: '8px' }} />
              </Link>
              <Link className="btn-secondary" to="/registar">
                <FaUserPlus style={{ marginRight: '8px' }} /> Criar conta
              </Link>
            </div>

            <div className="panel-divider" />

            <ul className="panel-list">
              <li><FaCheckCircle className="check-icon" /> Disponibilidade instantânea</li>
              <li><FaCheckCircle className="check-icon" /> Planta interativa da escola</li>
              <li><FaCheckCircle className="check-icon" /> Histórico de ocupação</li>
            </ul>

          </div>
        </aside>
      </main>

      <footer className="landing-footer-mobile">
        <span>FreeRoom ESTG • Projeto académico</span>
      </footer>
    </div>
  );
}