import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const JessyDashboardOverview = () => {
  const [vitals, setVitals] = useState([]);
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/api/vitals')
      .then((res) => res.json())
      .then(setVitals)
      .catch(() => setVitals([]));

    fetch('http://localhost:5000/api/chats')
      .then((res) => res.json())
      .then(setChats)
      .catch(() => setChats([]));
  }, []);

  const latestVitals = vitals.slice(0, 2);
  const latestChats = chats.slice(-2);

  return (
    <div style={styles.container}>
      <h2>📊 Jessy Dashboard Overview</h2>

      <div style={styles.stats}>
        <div style={styles.card}>
          <h3>🩺 Total Vitals</h3>
          <p><strong>{vitals.length}</strong></p>
          <div style={styles.preview}>
            {latestVitals.map((v, i) => (
              <div key={i} style={{ marginBottom: '0.5rem' }}>
                <div><strong>BP:</strong> {v.bp}, <strong>O₂:</strong> {v.oxygen}</div>
                <div><em>{new Date(v.timestamp).toLocaleString()}</em></div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <h3>💬 Total Messages</h3>
          <p><strong>{chats.length}</strong></p>
          <div style={styles.preview}>
            {latestChats.map((c, i) => (
              <div key={i} style={{ marginBottom: '0.5rem' }}>
                <div><strong>{c.sender}:</strong> {c.message.length > 30 ? c.message.slice(0, 30) + '...' : c.message}</div>
                <div><em>{new Date(c.timestamp).toLocaleString()}</em></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.actions}>
        <button onClick={() => navigate('/health')}>🩺 Log Vitals</button>
        <button onClick={() => navigate('/clone')}>💬 Talk to Jessy</button>
        <button onClick={() => navigate('/memory')}>🧠 View Memory</button>
        <button onClick={() => navigate('/opponent')}>⚖️ Jessy Opponent</button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '750px',
    margin: 'auto',
    textAlign: 'center',
  },
  stats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  card: {
    padding: '1rem',
    border: '1px solid #ccc',
    borderRadius: '8px',
    width: '300px',
    background: '#f1f1f1',
    textAlign: 'left',
  },
  preview: {
    marginTop: '1rem',
    fontSize: '0.9rem',
    color: '#333',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '1rem',
  },
};

export default JessyDashboardOverview;