import React, { useEffect, useState } from 'react';

export default function ExpenseList({ refresh }) {
  const [expenses, setExpenses] = useState([]);

  // Function to fetch data from db
  const fetchExpenses = async () => {
    try {
      const res = await fetch("http://localhost:5000/expenses");
      const data = await res.json();
      setExpenses(data);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    }
  };
  
  // Function to handle deleting
  const handleDelete = async (id) => {
    try {
      // 1. Send the DELETE request to the backend
      await fetch(`http://localhost:5000/expenses/${id}`, {
        method: "DELETE",
      });
      // 2. Refresh the list (fetch the data again)
      fetchExpenses(); 
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  };

  // Loads expenses on render and refresh
  useEffect(() => {
    fetchExpenses();
  }, [refresh]);

  return (
    <div>
      <h2>Expenses</h2>
      <ul>
        {expenses.map((exp) => (
          <li key={exp.id}>
            ${exp.amount} – {exp.category} – {exp.description} – {exp.date}
            
            // delete button
            <button 
              onClick={() => handleDelete(exp.id)} 
              style={{ marginLeft: '10px' }}>
              Delete
            </button>

          </li>
        ))}
      </ul>
    </div>
  );
}
