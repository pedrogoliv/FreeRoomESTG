import React from 'react';
import Logo from './logo'; // Importa o componente que criámos antes
import "./LoadingScreen.css";

export default function LoadingScreen() {
  return (
    <div className="loading-container">
      
      {/* Wrapper para aumentar o tamanho do logo sem estragar o CSS original */}
      <div className="loading-logo-scale">
        <Logo />
      </div>

      {/* Spinner por baixo */}
      <div className="spinner"></div>

    </div>
  );
}