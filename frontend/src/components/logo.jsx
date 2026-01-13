import React from 'react';
import './logo.css';

const Logo = () => {
  return (
    <div className="logo-container">
      
      <div className="logo-icon-box">
        <img src="/livro512x512.png" alt="FreeRoom Logo" />
      </div>

      <div className="logo-text-container">
        <span className="logo-main-text">FreeRoom</span>
        <span className="logo-badge-text">ESTG</span>
      </div>

    </div>
  );
};

export default Logo;