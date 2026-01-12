import { Link } from "react-router-dom";
import { FaCheckCircle, FaArrowRight, FaUserPlus } from "react-icons/fa";
import Logo from "../components/logo";
import "./Landing.css";

export default function Landing() {
  return (
    <div className="landing">
      {/* Overlay para dar textura/escurecer um pouco o video/bg se tiveres */}
      <div className="landing-overlay" />

      <header className="landing-header">
        <Logo />
      </header>

      <main className="landing-main">
        {/* LADO ESQUERDO */}
        <section className="landing-hero">
          <h1>
            Encontra salas livres <br />
            <span className="text-gradient">em tempo real</span>
          </h1>
          <p>
            Nunca mais percas tempo à procura de um sítio para estudar. 
          </p>
        </section>

        {/* LADO DIREITO (CARD DE VIDRO) */}
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