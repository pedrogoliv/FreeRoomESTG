import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";

export default function Dashboard() {
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);

  // DIA e HORA
  const [diaSelecionado, setDiaSelecionado] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [horaSelecionada, setHoraSelecionada] = useState("10:00");

  // Garantir que não dá para reservar salas em dias e horas que já passaram
  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  // arredonda para o próximo slot de 30 min (ex: 09:10 -> 09:30, 09:40 -> 10:00)
  function nextHalfHour() {
    const now = new Date();
    const m = now.getMinutes();
    const h = now.getHours();

    if (m === 0) return `${pad2(h)}:00`;
    if (m <= 30) return `${pad2(h)}:30`;
    return `${pad2((h + 1) % 24)}:00`;
  }

  function hojeISO() {
    return new Date().toISOString().split("T")[0];
  }

  const hoje = hojeISO();
  const minHoraHoje = nextHalfHour();

  // UI Figma: pesquisa + tabs
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("todas"); // "todas" | "1" | "2" | "3"

  // Base da API (se tiveres proxy no Vite, podes trocar para "" e usar só /api/...)
  const API_BASE = "http://localhost:5000";

  // --- FUNÇÃO PARA GERAR HORÁRIOS (08:00 às 22:00) ---
  const gerarHorarios = () => {
    const slots = [];
    for (let h = 8; h <= 22; h++) {
      const horaString = h < 10 ? `0${h}` : `${h}`;
      slots.push(`${horaString}:00`);
      if (h < 22) slots.push(`${horaString}:30`);
    }
    return slots;
  };

  const listaHorarios = gerarHorarios();

  // Se o dia selecionado for hoje, só mostrar horas >= minHoraHoje
  const listaHorariosFiltrada = useMemo(() => {
    if (diaSelecionado !== hoje) return listaHorarios;
    return listaHorarios.filter((h) => h >= minHoraHoje);
  }, [diaSelecionado, hoje, listaHorarios, minHoraHoje]);

  // Se mudar para hoje e a hora ficar inválida, corrigir automaticamente
  useEffect(() => {
    if (diaSelecionado === hoje && horaSelecionada < minHoraHoje) {
      const primeiraValida = listaHorariosFiltrada[0] || minHoraHoje;
      setHoraSelecionada(primeiraValida);
    }
  }, [diaSelecionado, hoje, horaSelecionada, minHoraHoje, listaHorariosFiltrada]);

  // Backup de segurança: escola fechada
  const foraDeHoras = horaSelecionada < "08:00" || horaSelecionada > "22:30";

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

  // Filtrar por query + tab (piso)
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

  // Stats (baseadas no filtro atual)
  const totalSalas = salasFiltradas.length;
  const totalLivres = salasFiltradas.filter((s) => s.status === "Livre").length;
  const totalOcupadas = totalSalas - totalLivres;

  function handleDetalhes(item) {
    // placeholder — depois ligamos a modal/página de detalhes
    alert(`Detalhes da sala ${item.sala} (${item.status})`);
  }

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        {/* HEADER + filtros dia/hora */}
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Salas em Tempo Real</h1>
            <p className="dashboard-subtitle">Gestão de espaços da ESTG</p>
          </div>

          <div className="filters">
            <div className="filtro-box">
              <label>Dia</label>
              <input
                type="date"
                value={diaSelecionado}
                min={hoje}  // ⬅️ bloqueia datas passadas
                onChange={(e) => setDiaSelecionado(e.target.value)}
              />
            </div>

            <div className="filtro-box">
              <label>Hora</label>
              <select
                value={horaSelecionada}
                onChange={(e) => setHoraSelecionada(e.target.value)}
              >
                {listaHorariosFiltrada.map((horario) => (
                  <option key={horario} value={horario}>
                    {horario}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* CONTROLS: search + tabs */}
        <div className="controlsRow">
          <div className="search">
            <input
              className="searchInput"
              placeholder="Procura o número de uma sala"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="searchIcon">🔎</span>
          </div>

          <div className="tabs">
            <button
              className={tab === "todas" ? "tab active" : "tab"}
              onClick={() => setTab("todas")}
            >
              Todas as salas
            </button>
            <button
              className={tab === "1" ? "tab active" : "tab"}
              onClick={() => setTab("1")}
            >
              Piso 1
            </button>
            <button
              className={tab === "2" ? "tab active" : "tab"}
              onClick={() => setTab("2")}
            >
              Piso 2
            </button>
            <button
              className={tab === "3" ? "tab active" : "tab"}
              onClick={() => setTab("3")}
            >
              Piso 3
            </button>
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
            {/* STATS */}
            <div className="stats-container">
              <div className="stat-card">
                <span className="stat-numero">{totalSalas}</span>
                <span className="stat-label">Total de salas</span>
              </div>

              <div className="stat-card">
                <span className="stat-numero green">
                  {totalLivres} <span className="dot greenDot" />
                </span>
                <span className="stat-label">Disponíveis agora</span>
              </div>

              <div className="stat-card">
                <span className="stat-numero red">
                  {totalOcupadas} <span className="dot redDot" />
                </span>
                <span className="stat-label">Ocupadas agora</span>
              </div>
            </div>

            {/* GRID SALAS */}
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
                      <div className="sala-meta">
                        🏢 Piso {item.piso} • 👥 {item.lugares} lugares
                      </div>

                      <div className={`sala-hora ${livre ? "txtGreen" : "txtRed"}`}>
                        {livre ? `✅ Livre às ${horaSelecionada}` : `⛔ Ocupada`}
                      </div>
                    </div>

                    <button
                      className="btn-details"
                      onClick={() => handleDetalhes(item)}
                    >
                      Ver detalhes
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
