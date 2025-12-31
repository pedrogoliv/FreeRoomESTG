import { useMemo } from "react";
import Sidebar from "../components/Sidebar";
import "./Perfil.css";

export default function Perfil() {
  const user = {
    nome: "Luís Gomes",
    numero: "47593",
    curso: "Engenharia Informática",
  };

  const reservas = [
    { sala: "S.1.11", dia: "2026-01-06", hora_inicio: "10:30", hora_fim: "12:00" },
    { sala: "A.2.1", dia: "2026-01-10", hora_inicio: "14:00", hora_fim: "15:30" },
    { sala: "S.1.11", dia: "2026-01-12", hora_inicio: "09:00", hora_fim: "10:00" },
    { sala: "L.2.6", dia: "2025-12-29", hora_inicio: "11:00", hora_fim: "12:30" },
    { sala: "S.1.11", dia: "2025-12-18", hora_inicio: "16:00", hora_fim: "18:00" },
  ];

  const toMinutes = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const stats = useMemo(() => {
    const now = new Date();
    const ano = now.getFullYear();
    const mes = now.getMonth() + 1;

    const reservasMes = reservas.filter((r) => {
      const [y, mo] = r.dia.split("-").map(Number);
      return y === ano && mo === mes;
    });

    const totalMinutos = reservas.reduce((acc, r) => {
      const ini = toMinutes(r.hora_inicio);
      const fim = toMinutes(r.hora_fim);
      return acc + Math.max(0, fim - ini);
    }, 0);

    const totalHoras = (totalMinutos / 60).toFixed(1);

    const freq = {};
    for (const r of reservas) freq[r.sala] = (freq[r.sala] || 0) + 1;

    let salaTop = "—";
    let max = 0;
    for (const [sala, count] of Object.entries(freq)) {
      if (count > max) {
        max = count;
        salaTop = sala;
      }
    }

    return {
      reservasEsteMes: reservasMes.length,
      totalHorasReservadas: totalHoras,
      salaMaisReservada: salaTop,
    };
  }, [reservas]);

  const verEstatisticas = () => {
    alert(
      `Reservas este mês: ${stats.reservasEsteMes}\n` +
      `Total de horas reservadas: ${stats.totalHorasReservadas}h\n` +
      `Sala mais reservada: ${stats.salaMaisReservada}`
    );
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

          {/* CARTÃO 3: ESTATÍSTICAS (igual ao outro, com botão) */}
          <div className="card">
            <div className="icon-circle">📊</div>
            <div className="separator"></div>

            <h3>Estatísticas</h3>
            <p>Resumo da tua atividade</p>

            <button className="btn-action" onClick={verEstatisticas}>
              Ver
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
