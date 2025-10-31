import React, { useEffect, useState } from 'react';

const VitalsLogs = () => {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5678/webhook/get-vitals-logs')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => {
        console.log("🔥 Raw data from backend:", data);
        const formatted = data.map((item) => {
          console.log("👉 Item:", item);
          return {
          timestamp: item.Timestamp || item.timestamp || '-',
          glucose: item.Glucose || item.glucose || '-',
          bp: item.BP || item.bp || '-',
          oxygen: item.Oxygen || item.oxygen || '-',
          bodyTemp: item.bodyTemp || item["Body Temp"] || '-',
          weight: item.Weight || item.weight || '-',
          pain: item["Pain/Discomfort"] || item.pain || '-',
          mood: item.Mood || item.mood || '-',
          notes: item.Notes || item.notes || '-',
        };
        });
        console.log("✅ Formatted logs:", formatted);
        setLogs(formatted);
      })
      .catch((err) => {
        console.error('Vitals fetch error:', err);
        setError(true);
      });
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: 'auto' }}>
      <h2>📘 Vitals Logs</h2>
      {error ? (
        <p style={{ color: 'red' }}>
          ⚠️ Failed to load vitals. Check if n8n and the vitals webhook are active.
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }} border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Glucose</th>
              <th>BP</th>
              <th>Oxygen</th>
              <th>Body Temp</th>
              <th>Weight</th>
              <th>Pain/Discomfort</th>
              <th>Mood</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log, i) => (
                <tr key={i}>
                  <td>{log.timestamp}</td>
                  <td>{log.glucose}</td>
                  <td>{log.bp}</td>
                  <td>{log.oxygen}</td>
                  <td>{log.bodyTemp}</td>
                  <td>{log.weight}</td>
                  <td>{log.pain}</td>
                  <td>{log.mood}</td>
                  <td>{log.notes}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>No vitals logged yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default VitalsLogs;