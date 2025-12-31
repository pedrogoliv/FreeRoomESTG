import Sidebar from "../components/Sidebar";
import "./Perfil.css";

export default function Profile() {
  const user = {
    nome: "Luís Gomes",
    numero: "47593",
    curso: "Engenharia Informática",
  };

  return (
    <div className="perfil-page">
      <Sidebar />

      <main className="perfil-container">
        <h1 className="titulo-pagina">O Meu Perfil</h1>

        <div className="cards-grid">
          
          {/* CARTÃO 1: DADOS DO UTILIZADOR */}
          <div className="card">
            <button className="btn-edit">✏️ Editar</button>

            <div className="icon-circle">👤</div>
            <div className="separator"></div>

            <h3>{user.nome}</h3>
            <p>Nº {user.numero}</p>
            <br />
            <p>{user.curso}</p>
          </div>

          {/* CARTÃO 2: ÚLTIMAS RESERVAS */}
          <div className="card">
            <div className="icon-circle">🕒</div>
            <div className="separator"></div>

            <h3>Últimas Reservas</h3>
            <p>Consulta o teu histórico</p>

            <button className="btn-action">Ver</button>
          </div>

          {/* CARTÃO 3: Estatísticas */}
          <div className="card">
            <div className="icon-circle">📊</div>
            <div className="separator"></div>

            <h3>Estatísticas</h3>
            <p>As tuas estatísticas</p>

            <button className="btn-action">
              Ver
            </button>
          </div>
          
        </div>
      </main>
    </div>
  );
}