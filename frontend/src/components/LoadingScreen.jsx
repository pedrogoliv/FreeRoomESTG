import React from 'react';
import Logo from './logo';
import "./LoadingScreen.css";

export default function LoadingScreen() {
  return (
    <div className="loading-container">
      
      <div className="loading-logo-scale">
        <Logo />
      </div>

      <div className="spinner"></div>

    </div>
  );
}