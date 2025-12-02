 import React, { useState, useEffect } from "react";

export default function MonthlySummary() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [summary, setSummary] = useState(null);
  const [comparison, setComparison] = useState(null);

  const fetchData = async () => {
    const base = "http://localhost:5000/expenses";

    // Fetch summary
    const summaryRes = await fetch(
      `${base}/summary?year=${year}&month=${month}`
    );
    const summaryData = await summaryRes.json();

    // Fetch month-over-month comparison
    const compareRes = await fetch(
      `${base}/compare?year=${year}&month=${month}`
    );
    const compareData = await compareRes.json();

    setSummary(summaryData);
    setComparison(compareData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 24 }}>
      <h2>Monthly Analytics</h2>

      {/* ------------------ Month Picker ------------------ */}
      <form onSubmit={handleSubmit}>
        <label>
          Year:{" "}
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            style={{ width: 80 }}
          />
        </label>{" "}
        <label>
          Month:{" "}
          <input
            type="number"
            min="1"
            max="12"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ width: 60 }}
          />
        </label>{" "}
        <button type="submit">Update</button>
      </form>

      {/* ------------------ Summary Display ------------------ */}
      {summary && (
        <div style={{ marginTop: 16 }}>
          <p>
            <strong>Total Spending:</strong> ${summary.totalSpending.toFixed(2)}
          </p>
          <p>
            <strong>Average Daily Spending:</strong>{" "}
            ${summary.averageDailyExpenditure.toFixed(2)}
          </p>

          <h3>Breakdown by Category</h3>
          <ul>
            {summary.categoryBreakdown.map((cat) => (
              <li key={cat.category}>
                {cat.category}: ${cat.total.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ------------------ Month Comparison ------------------ */}
      {comparison && (
        <div style={{ marginTop: 16 }}>
          <h3>Month-over-Month Comparison</h3>

          <p>
            <strong>Last Month Spending:</strong> $
            {comparison.previous.totalSpending.toFixed(2)}
          </p>

          <p>
            <strong>This Month Spending:</strong> $
            {comparison.current.totalSpending.toFixed(2)}
          </p>

          {comparison.direction === "increase" && (
            <p style={{ color: "red" }}>
              ↑ Spending increased by {comparison.percentChange.toFixed(1)}%
            </p>
          )}

          {comparison.direction === "decrease" && (
            <p style={{ color: "green" }}>
              ↓ Spending decreased by {comparison.percentChange.toFixed(1)}%
            </p>
          )}

          {comparison.direction === "no-change" && (
            <p>Spending stayed the same as last month.</p>
          )}

          {comparison.direction === "increase-from-zero" && (
            <p>Spending increased from $0 last month.</p>
          )}
        </div>
      )}
    </div>
  );
}

