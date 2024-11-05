// src/components/Sidebar.jsx
import React from 'react';
import '../assets/Sidebar.css';

function Sidebar({ onNavigate }) {
  return (
    <div className="sidebar">
      <h2>Menú Principal</h2>
      <ul className="menu-list">
        <li onClick={() => onNavigate('dashboard')}>Production Dashboard</li>
        <li onClick={() => onNavigate('newProcess')}>New Process Form</li>
        <li onClick={() => onNavigate('ingredientCalculator')}>Ingredient Calculator</li>
        <li onClick={() => onNavigate('productionList')}>Production List</li>
        <li onClick={() => onNavigate('processDetails')}>Process Details</li>
        <li onClick={() => onNavigate('settings')}>Settings</li>
        <li onClick={() => onNavigate('data')}>Admin</li>
      </ul>
    </div>
  );
}

export default Sidebar;

