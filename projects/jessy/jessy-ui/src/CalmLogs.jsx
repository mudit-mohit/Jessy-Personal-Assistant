import React, { useEffect, useState } from 'react';

const CalmLogs = () => {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5678/webhook/get-calm-logs')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          const formatted = data.map((item) => ({
            timestamp: item.Timestamp || '-',
            phase: item.Phase || '-',
            duration: item.Duration || '-',
            notes: item.Notes || '-',
          }));
          setLogs(formatted);
        } else {
          throw new Error('Unexpected format');
        }
      })
      .catch((err) => {
        console.error('Log fetch error:', err);
        setError(true);
      });
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: 'auto' }}>
      <h2>🧘 Calm Protocol Logs</h2>
      {error ? (
        <p style={{ color: 'red' }}>
          ⚠️ Failed to load logs. Make sure n8n and the Calm Session webhook are running and reachable.
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }} border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Phase</th>
              <th>Duration (s)</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log, i) => (
                <tr key={i}>
                  <td>{log.timestamp}</td>
                  <td>{log.phase}</td>
                  <td>{log.duration}</td>
                  <td>{log.notes}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center' }}>
                  No calm sessions logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CalmLogs;