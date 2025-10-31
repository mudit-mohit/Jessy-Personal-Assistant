import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

const CalmAnalytics = () => {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5678/webhook/get-calm-logs')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLogs(data);
        } else {
          const formatted = data.map((item) => item.json);
          setLogs(formatted);
        }
      })
      .catch((err) => {
        console.error('Error loading analytics:', err);
        setError(true);
      });
  }, []);

  if (error) {
    return <p style={{ color: 'red', textAlign: 'center' }}>⚠️ Could not load analytics data.</p>;
  }

  const labels = logs.map((log) => {
    const date = new Date(log.Timestamp || log.timestamp);
    return date.toLocaleString();
  });

  const durations = logs.map((log) => Number(log.Duration || log.duration || 0));

  const average = durations.length
    ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2)
    : 0;

  return (
    <div style={{ maxWidth: '800px', margin: 'auto', padding: '2rem' }}>
      <h2>📊 Calm Protocol Analytics</h2>
      <p><strong>Total Sessions:</strong> {logs.length}</p>
      <p><strong>Average Duration:</strong> {average} seconds</p>

      <Bar
        data={{
          labels,
          datasets: [
            {
              label: 'Calm Session Duration (s)',
              data: durations,
              backgroundColor: '#4bc0c0',
            },
          ],
        }}
        options={{ responsive: true }}
      />

      <div style={{ marginTop: '2rem' }}>
        <Line
          data={{
            labels,
            datasets: [
              {
                label: 'Session Duration Over Time',
                data: durations,
                borderColor: '#ff6384',
                fill: false,
              },
            ],
          }}
          options={{ responsive: true }}
        />
      </div>
    </div>
  );
};

export default CalmAnalytics;