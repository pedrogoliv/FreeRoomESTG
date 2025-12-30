import { useEffect, useState } from 'react';
import './Dashboard.css'; // Importa o CSS que criámos acima

export default function Dashboard() {
  const [ocupacoes, setOcupacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Ir buscar dados ao Backend quando a página abre
  useEffect(() => {
    fetch('http://localhost:5000/api/todas-ocupacoes')
      .then(res => res.json())
      .then(dados => {
        setOcupacoes(dados);
        setLoading(false);
      })
      .catch(erro => {
        console.error("Erro ao buscar salas:", erro);
        setLoading(false);
      });
  }, []);

  return (
    <div className="dashboard-container">
      
      {/* MENU LATERAL */}
      <aside className="sidebar">
        <h2>FreeRoom ESTG</h2>
        <ul>
          <li className="active">🏠 Visão Geral</li>
          <li>📅 As Minhas Reservas</li>
          <li>🔍 Procurar Sala</li>
          <li>❤️ Favoritos</li>
        </ul>
        <button className="btn-logout" onClick={() => window.location.reload()}>
          Sair
        </button>
      </aside>

      {/* CONTEÚDO */}
      <main className="main-content">
        <div className="header">
          <h1>Ocupação em Tempo Real</h1>
          <span>Olá, Estudante 👋</span>
        </div>

        {loading ? (
          <p>⏳ A carregar horários...</p>
        ) : (
          <div className="grid-salas">
            {/* Se não houver aulas, mostra mensagem */}
            {ocupacoes.length === 0 && <p>Tudo livre! Nenhuma aula a decorrer.</p>}

            {/* Mapear os dados do MongoDB para Cartões */}
            {ocupacoes.map((item) => (
              <div key={item._id} className="card-sala">
                <div className="sala-nome">{item.sala}</div>
                
                <span className="sala-hora">
                  ⏰ {item.hora_inicio} - {item.hora_fim}
                </span>
                
                <div style={{marginTop: '10px'}}>
                  <span className="tag-status">
                    {item.curso || "Ocupado"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

    </div>
  );
}