import React, { useState } from "react";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";
import Recommendations from './components/Recommendations';
import './App.css';

function App() {
  const [refresh, setRefresh] = useState(false);

  const handleRefresh = () => {
    setRefresh(!refresh);
  };

  // Incorporate all device tipes
return (
  <div className="app-container">
    <h1>Expense Tracker</h1>
    <ExpenseForm onAdd={handleRefresh} />
    <ExpenseList refresh={refresh} />
    <Recommendations refresh={refresh} />
  </div>
);
}

export default App;



