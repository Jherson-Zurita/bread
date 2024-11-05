// src/App.jsx
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ProductionDashboard from './components/ProductionDashboard';
import NewProcessForm from './components/NewProcessForm';
import IngredientCalculator from './components/IngredientCalculator';
import ProductionList from './components/ProductionList';
import ProcessDetails from './components/ProcessDetails';
import Settings from './components/Settings';
import AddTestData from './components/AddTestData';
import "../src/assets/App.css";
// Importa los demás componentes necesarios aquí...

function App() {
  const [activeComponent, setActiveComponent] = useState('dashboard');

  const renderComponent = () => {
    switch (activeComponent) {
      case 'dashboard':
        return <ProductionDashboard />;
      case 'newProcess':
        return <NewProcessForm />;
      case 'ingredientCalculator':
        return <IngredientCalculator />;
      case 'productionList':
        return <ProductionList />;
      case 'processDetails':
        return <ProcessDetails />;
      case 'settings':
        return <Settings />;
      case 'data':
        return <AddTestData />;
      default:
        return <ProductionDashboard />;
    }
  };

  return (
    <div className="app">
      <div className="sidebar">
        <Sidebar onNavigate={setActiveComponent} />
      </div>
      <div className="main-content">
        {renderComponent()}
      </div>
    </div>
  );
}

export default App;


