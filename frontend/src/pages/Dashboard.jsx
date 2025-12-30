import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import './Dashboard.css';

export default function Dashboard() {
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Guardamos DIA e HORA
  const [diaSelecionado, setDiaSelecionado] = useState(new Date().toISOString().split('T')[0]);
  const [horaSelecionada, setHoraSelecionada] = useState("10:00");

  // --- FUNÇÃO PARA GERAR HORÁRIOS (08:00 às 22:00) ---
  const gerarHorarios = () => {
    const slots = [];
    for (let h = 8; h <= 22; h++) {
      // Formata para ter sempre dois dígitos (ex: "08" ou "14")
      const horaString = h < 10 ? `0${h}` : `${h}`;
      
      // Adiciona a hora certa (ex: 09:00)
      slots.push(`${horaString}:00`);
      
      // Adiciona a meia hora (ex: 09:30), exceto se for 22h (escola fecha)
      if (h < 22) {
        slots.push(`${horaString}:30`);
      }
    }
    return slots;
  };

  const listaHorarios = gerarHorarios();

  // Verificar se a escola está fechada (Backup de segurança)
  // Agora é mais difícil acontecer porque o user só escolhe da lista, mas mantemos a lógica.
  const foraDeHoras = horaSelecionada < "08:00" || horaSelecionada > "22:30";

  useEffect(() => {
    if (foraDeHoras) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    fetch(`http://localhost:5000/api/salas-livres?dia=${diaSelecionado}&hora=${horaSelecionada}`)
      .then(res => res.json())
      .then(dados => {
        setSalas(dados);
        setLoading(false);
      })
      .catch(erro => {
        console.error("Erro:", erro);
        setLoading(false);
      });
  }, [diaSelecionado, horaSelecionada, foraDeHoras]);

  // Contas para os cartões de cima
  const totalSalas = salas.length;
  const totalLivres = salas.filter(s => s.status === "Livre").length;
  const totalOcupadas = totalSalas - totalLivres;

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        
        {/* HEADER E FILTROS */}
        <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ color: '#2c3e50' }}>Salas em Tempo Real</h1>
            <p style={{ color: '#7f8c8d' }}>Gestão de espaços da ESTG</p>
          </div>
          
          <div style={{ display: 'flex', gap: '15px' }}>
             {/* SELETOR DE DATA */}
             <div className="filtro-box">
                <label>Dia</label>
                <input 
                  type="date" 
                  value={diaSelecionado} 
                  onChange={e => setDiaSelecionado(e.target.value)} 
                />
             </div>

             {/* NOVO SELETOR DE HORA (DROPDOWN 24H) */}
             <div className="filtro-box">
                <label>Hora</label>
                <select 
                  value={horaSelecionada} 
                  onChange={e => setHoraSelecionada(e.target.value)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #dcdde1',
                    backgroundColor: 'white',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    minWidth: '100px'
                  }}
                >
                  {listaHorarios.map(horario => (
                    <option key={horario} value={horario}>
                      {horario}
                    </option>
                  ))}
                </select>
             </div>
          </div>
        </header>

        {loading ? <p>⏳ A carregar dados...</p> : (
          <>
            {foraDeHoras ? (
                 <div style={{ textAlign: 'center', padding: '40px', color: '#e74c3c' }}>
                    <h2>🌙 Escola Fechada</h2>
                </div>
            ) : (
                <>
                    {/* CARTÕES DE ESTATÍSTICA */}
                    <div className="stats-container">
                        <div className="stat-card" style={{ borderBottom: '4px solid #95a5a6' }}>
                            <span className="stat-numero">{totalSalas}</span>
                            <span className="stat-label">Total de Salas</span>
                        </div>
                        <div className="stat-card" style={{ borderBottom: '4px solid #2ecc71' }}>
                            <span className="stat-numero" style={{color: '#27ae60'}}>{totalLivres}</span>
                            <span className="stat-label">Disponíveis 🟢</span>
                        </div>
                        <div className="stat-card" style={{ borderBottom: '4px solid #e74c3c' }}>
                            <span className="stat-numero" style={{color: '#c0392b'}}>{totalOcupadas}</span>
                            <span className="stat-label">Ocupadas 🔴</span>
                        </div>
                    </div>

                    {/* GRELHA DE SALAS */}
                    <div className="grid-salas">
                        {salas.map((item) => (
                            <div key={item.nome} className="card-sala"
                                style={{ 
                                    borderLeft: item.status === 'Livre' ? '5px solid #2ecc71' : '5px solid #e74c3c',
                                    backgroundColor: item.status === 'Livre' ? 'white' : '#fff5f5'
                                }}
                            >
                                <div className="sala-nome">{item.sala}</div>
                                
                                <div style={{ fontSize: '0.85rem', color: '#7f8c8d', margin: '5px 0' }}>
                                    🏢 Piso {item.piso} • 👥 {item.lugares} Lugares
                                </div>

                                <div className="sala-hora" style={{
                                    color: item.status === 'Livre' ? '#27ae60' : '#c0392b',
                                    fontWeight: 'bold'
                                }}>
                                    {item.status === 'Livre' ? `✅ Livre às ${horaSelecionada}` : `⛔ Ocupada`}
                                </div>
                                
                                {item.status === 'Livre' && (
                                    <div style={{ marginTop: '15px' }}>
                                        <button style={{
                                            width: '100%', padding: '8px', background: '#2ecc71',
                                            color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                                        }} onClick={() => alert(`Reservar ${item.sala}?`)}>
                                        RESERVAR
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
          </>
        )}
      </main>
    </div>
  );
}