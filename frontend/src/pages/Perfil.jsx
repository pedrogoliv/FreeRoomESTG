import Sidebar from '../components/Sidebar'; // Mantemos a sidebar para navegar
import './Perfil.css';

export default function Perfil() {
  // Dados simulados (depois vêm do Login/User)
  const user = {
    nome: "Luís Gomes",
    numero: "47593",
    curso: "Engenharia Informática"
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      
      <Sidebar />

      <main className="perfil-container">
        <h1 className="titulo-pagina">O Meu Perfil</h1>

        <div className="cards-grid">
          
          {/* CARTÃO 1: DADOS DO UTILIZADOR */}
          <div className="card">
            <button className="btn-edit">✏️ Editar</button>
            
            <div className="icon-circle">👤</div> {/* Ícone Boneco */}
            <div className="separator"></div>
            
            <h3>{user.nome}</h3>
            <p>Nº {user.numero}</p>
            <br />
            <p>{user.curso}</p>
          </div>

          {/* CARTÃO 2: ÚLTIMAS RESERVAS */}
          <div className="card">
            <div className="icon-circle">🕒</div> {/* Ícone Relógio */}
            <div className="separator"></div>
            
            <h3>Últimas Reservas</h3>
            <p>Consulta o teu histórico</p>
            
            <button className="btn-action">Ver</button>
          </div>

          {/* CARTÃO 3: FAVORITOS */}
          <div className="card">
            <div className="icon-circle">⭐</div> {/* Ícone Estrela */}
            <div className="separator"></div>
            
            <h3>Favoritos</h3>
            <p>As tuas salas preferidas</p>
            
            <button className="btn-action">Ver</button>
          </div>

        </div>
      </main>
    </div>
  );
}