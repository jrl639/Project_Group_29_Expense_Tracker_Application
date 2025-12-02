import React, { useEffect, useState } from 'react';

export default function Recommendations({ refresh }) {
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/expenses/recommendations')
      .then(res => res.json())
      .then(data => setRecommendations(data));
  }, [refresh]);

  return (
    <div className="recommendations">
      <h2>Personalized Recommendations</h2>
      {recommendations.length > 0 ? (
        <ul>
          {recommendations.map((rec, index) => (
            <li key={index}>{rec.message}</li>
          ))}
        </ul>
      ) : (
        <p>Add more expenses to get personalized insights!</p>
      )}
    </div>
  );
}
