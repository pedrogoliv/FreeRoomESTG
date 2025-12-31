import React from 'react';
import Sidebar from '../components/Sidebar';
import './Favoritos.css';

export default function Favoritos() {
  return (
    <div style={{ display: 'flex', background: '#f6f7fb', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ padding: '40px', flex: 1 }}>
        
        <h1 className="titulo-pagina">Meus Favoritos</h1>
        
        <p>Por fazer.</p>
      </div>
    </div>
  );
}