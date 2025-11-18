import React, { useEffect, useState } from 'react';

// accepts requests
export default function ExpenseList({ refresh, onEdit, onRefresh }) { 
  const [expenses, setExpenses] = useState([]);

  // For fetching
  const fetchExpenses = async () => {
    const res = await fetch("http://localhost:5000/expenses");
    const data = await res.json();
    setExpenses(data);
  };
  
  // Delete Function
  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/expenses/${id}`, {
      method: "DELETE",
    });
    if (onRefresh) onRefresh(); 
  };

  useEffect(() => {
    fetchExpenses();
  }, [refresh]);

  return (
    <div>
      <h2>Expenses</h2>
      <ul>
        {expenses.map((exp) => (
          <li key={exp.id}>
            ${exp.amount} – {exp.category} – {exp.description} – {exp.date.split('T')[0]}
            
            // edit button
            <button 
              onClick={() => onEdit(exp)} 
              style={{ marginLeft: '10px', background: 'blue', color: 'white' }}>
              Edit
            </button>
            
            // delete button
            <button 
              onClick={() => handleDelete(exp.id)} 
              style={{ marginLeft: '10px', background: 'red', color: 'white' }}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

