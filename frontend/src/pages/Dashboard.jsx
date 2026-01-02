// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import DetalhesSala from "../components/detalhesSala";
import "./Dashboard.css";

export default function Dashboard() {
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. LER O UTILIZADOR LOGADO ---
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Tenta ler do localStorage ou sessionStorage
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // --- STATES PARA O MODAL E FAVORITOS ---
  const [salaSelecionada, setSalaSelecionada] = useState(null);
  const [favoritosIds, setFavoritosIds] = useState([]); 

  const API_BASE = "http://localhost:5000";

  // --- 2. CARREGAR FAVORITOS DA BD (CORRIGIDO) ---
  useEffect(() => {
    // ✅ MUDANÇA: Agora verificamos user.username em vez de user.id
    if (user && user.username) {
      fetch(`${API_BASE}/api/favoritos/${user.username}`) // 👈 Pede pelo NOME
        .then((res) => res.json())
        .then((data) => {
          setFavoritosIds(data); 
        })
        .catch((err) => console.error("Erro ao buscar favoritos:", err));
    }
  }, [user]); 

  // --- LÓGICA DE DATAS E HORAS ---
  const [diaSelecionado, setDiaSelecionado] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [horaSelecionada, setHoraSelecionada] = useState("10:00");

  function pad2(n) { return String(n).padStart(2, "0"); }

  function nextHalfHour() {
    const now = new Date();
    const m = now.getMinutes();
    const h = now.getHours();
    if (m === 0) return `${pad2(h)}:00`;
    if (m <= 30) return `${pad2(h)}:30`;
    return `${pad2((h + 1) % 24)}:00`;
  }

  function hojeISO() { return new Date().toISOString().split("T")[0]; }

  const hoje = hojeISO();
  const minHoraHoje = nextHalfHour();

  // UI: Pesquisa e Tabs
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("todas");

  // --- LÓGICA DE HORÁRIOS ---
  const listaHorarios = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 22; h++) {
      const horaString = h < 10 ? `0${h}` : `${h}`;
      slots.push(`${horaString}:00`);
      if (h < 22) slots.push(`${horaString}:30`);
    }
    return slots;
  }, []);

  const listaHorariosFiltrada = useMemo(() => {
    if (diaSelecionado !== hoje) return listaHorarios;
    return listaHorarios.filter((h) => h >= minHoraHoje);
  }, [diaSelecionado, hoje, listaHorarios, minHoraHoje]);

  useEffect(() => {
    if (diaSelecionado === hoje && horaSelecionada < minHoraHoje) {
      const primeiraValida = listaHorariosFiltrada[0] || minHoraHoje;
      setHoraSelecionada(primeiraValida);
    }
  }, [diaSelecionado, hoje, horaSelecionada, minHoraHoje, listaHorariosFiltrada]);

  const foraDeHoras = horaSelecionada < "08:00" || horaSelecionada > "22:30";

  // --- API FETCH SALAS ---
  useEffect(() => {
    if (foraDeHoras) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(
      `${API_BASE}/api/salas-livres?dia=${encodeURIComponent(
        diaSelecionado
      )}&hora=${encodeURIComponent(horaSelecionada)}`
    )
      .then((res) => res.json())
      .then((dados) => {
        setSalas(Array.isArray(dados) ? dados : []);
        setLoading(false);
      })
      .catch((erro) => {
        console.error("Erro:", erro);
        setSalas([]);
        setLoading(false);
      });
  }, [diaSelecionado, horaSelecionada, foraDeHoras]);

  // --- FILTRAGEM ---
  const salasFiltradas = useMemo(() => {
    const q = query.trim().toLowerCase();
    return salas.filter((s) => {
      const salaTxt = String(s.sala ?? "").toLowerCase();
      const matchQuery = !q || salaTxt.includes(q);
      const pisoNum = Number(s.piso);
      const matchTab = tab === "todas" ? true : pisoNum === Number(tab);
      return matchQuery && matchTab;
    });
  }, [salas, query, tab]);

  const totalSalas = salasFiltradas.length;
  const totalLivres = salasFiltradas.filter((s) => s.status === "Livre").length;
  const totalOcupadas = totalSalas - totalLivres;

  // --- 3. FUNÇÃO TOGGLE (CORRIGIDO) ---
  const toggleFavorito = async (idDaSala) => {
    // ✅ MUDANÇA: Verifica se temos o username
    if (!user || !user.username) {
      alert("Erro de autenticação: Faz login novamente.");
      return;
    }

    // A. Atualização Visual (Imediata)
    setFavoritosIds((prevIds) => {
      if (prevIds.includes(idDaSala)) {
        return prevIds.filter((id) => id !== idDaSala);
      } else {
        return [...prevIds, idDaSala];
      }
    });

    // B. Envia para o servidor (Pelo Username)
    try {
      await fetch(`${API_BASE}/api/favoritos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: user.username, // ✅ Garante que envia o nome
          salaId: idDaSala 
        }),
      });
    } catch (error) {
      console.error("Erro ao guardar favorito", error);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Salas em Tempo Real</h1>
             {user && <span style={{fontSize: "0.9rem", color: "#64748b"}}>Olá, {user.username} 👋</span>}
          </div>

          <div className="filters">
            <div className="filtro-box">
              <label>Dia</label>
              <input type="date" value={diaSelecionado} min={hoje} onChange={(e) => setDiaSelecionado(e.target.value)} />
            </div>
            <div className="filtro-box">
              <label>Hora</label>
              <select value={horaSelecionada} onChange={(e) => setHoraSelecionada(e.target.value)}>
                {listaHorariosFiltrada.map((horario) => (
                  <option key={horario} value={horario}>{horario}</option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <div className="controlsRow">
          <div className="search">
            <input className="searchInput" placeholder="Procura o número de uma sala" value={query} onChange={(e) => setQuery(e.target.value)} />
            <span className="searchIcon">🔎</span>
          </div>
          <div className="tabs">
            {["todas", "1", "2", "3"].map((piso) => (
              <button key={piso} className={tab === piso ? "tab active" : "tab"} onClick={() => setTab(piso)}>
                {piso === "todas" ? "Todas as salas" : `Piso ${piso}`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p>⏳ A carregar dados...</p>
        ) : foraDeHoras ? (
          <div className="fechado">
            <h2>🌙 Escola Fechada</h2>
            <p>Seleciona um horário entre 08:00 e 22:30.</p>
          </div>
        ) : (
          <>
            <div className="stats-container">
              <div className="stat-card"><span className="stat-numero">{totalSalas}</span><span className="stat-label">Total de salas</span></div>
              <div className="stat-card"><span className="stat-numero green">{totalLivres} <span className="dot greenDot" /></span><span className="stat-label">Disponíveis agora</span></div>
              <div className="stat-card"><span className="stat-numero red">{totalOcupadas} <span className="dot redDot" /></span><span className="stat-label">Ocupadas agora</span></div>
            </div>

            <div className="grid-salas">
              {salasFiltradas.map((item) => {
                const livre = item.status === "Livre";
                const key = `${item.sala}-${item.piso}-${item.status}`;
                return (
                  <div key={key} className="card-sala">
                    <div className={`card-top ${livre ? "livre" : "ocupada"}`}>
                      <span className="statusDot" />
                      <span>{livre ? "Disponível" : "Ocupada"}</span>
                    </div>
                    <div className="card-body">
                      <div className="sala-nome">Sala {item.sala}</div>
                      <div className="sala-meta">🏢 Piso {item.piso} • 👥 {item.lugares} lugares</div>
                      <button className="btn-details" onClick={() => setSalaSelecionada(item)}>Ver detalhes</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {salaSelecionada && (
          <DetalhesSala
            sala={salaSelecionada}
            onClose={() => setSalaSelecionada(null)}
            isFavorito={favoritosIds.includes(salaSelecionada.sala)}
            onToggleFavorito={() => toggleFavorito(salaSelecionada.sala)}
          />
        )}
      </main>
    </div>
  );
}