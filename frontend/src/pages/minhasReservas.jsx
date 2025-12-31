import React from 'react';
import Sidebar from '../components/Sidebar';
import './minhasReservas.css'; 

export default function MinhasReservas() {
  return (
    <div className="page-container">
      <Sidebar />
      <main className="content-container">
        
        <h1 className="titulo-pagina">As Minhas Reservas</h1>
        
        <p style={{ color: '#6b7280' }}>Por fazer.</p>
      </main>
    </div>
  );
}