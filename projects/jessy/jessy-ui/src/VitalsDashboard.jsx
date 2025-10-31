import React, { useEffect, useState } from 'react';

function VitalsDashboard() {
  const [vitals, setVitals] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/vitals')
      .then((res) => res.json())
      .then((data) => setVitals(data))
      .catch((err) => console.error('Error fetching vitals:', err));
  }, []);

  const downloadCSV = () => {
    const headers = ['Timestamp', 'Glucose', 'BP', 'Oxygen', 'Body Temperature', 'Weight', 'Pain/Discomfort', 'Mood', 'Notes'];
    const rows = vitals.map((row) => [
      row.timestamp,
      row.glucose,
      row.bp,
      row.oxygen,
      row.bodyTemp,
      row.weight,
      row.pain,
      row.mood,
      row.notes,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers, ...rows].map((r) => r.join(',')).join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'vitals_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>📋 Vitals History</h2>

      <button onClick={downloadCSV} style={{ marginBottom: '1rem' }}>
        ⬇️ Download CSV
      </button>

      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Glucose</th>
            <th>BP</th>
            <th>Oxygen</th>
            <th>Body Temperature</th>
            <th>Weight</th>
            <th>Pain/Discomfort</th>
            <th>Mood</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {vitals.map((row, i) => (
            <tr key={i}>
              <td>{row.timestamp}</td>
              <td>{row.glucose}</td>
              <td>{row.bp}</td>
              <td>{row.oxygen}</td>
              <td>{row.bodyTemp}</td>
              <td>{row.weight}</td>
              <td>{row.pain}</td>
              <td>{row.mood}</td>
              <td>{row.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default VitalsDashboard;