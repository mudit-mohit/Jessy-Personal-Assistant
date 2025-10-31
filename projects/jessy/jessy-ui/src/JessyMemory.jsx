import React, { useEffect, useState } from 'react';

const JessyMemory = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = () => {
    fetch('http://localhost:5000/api/chats')
      .then((res) => res.json())
      .then((data) => {
        setChats(data);
        setLoading(false);
      })
      .catch(() => {
        setChats([{ sender: 'Error', message: 'Could not load memory.' }]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const clearChats = () => {
    fetch('http://localhost:5000/api/chats', { method: 'DELETE' }).then(() => setChats([]));
  };

  return (
    <div style={styles.container}>
      <h2>🧠 Jessy Memory</h2>

      {loading ? (
        <p>Loading memory...</p>
      ) : chats.length === 0 ? (
        <p>No memory found.</p>
      ) : (
        <div style={styles.chatBox}>
          {chats.map((msg, i) => (
            <div key={i} style={styles.message}>
              <strong>{msg.sender}:</strong> {msg.message}
              {msg.timestamp && (
                <div style={styles.timestamp}>
                  🕒 {new Date(msg.timestamp).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button onClick={clearChats} style={styles.clearButton}>
        🧹 Clear Memory
      </button>
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '700px',
    margin: 'auto',
    textAlign: 'center',
  },
  chatBox: {
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '1rem',
    maxHeight: '400px',
    overflowY: 'auto',
    backgroundColor: '#fdfdfd',
    marginBottom: '1rem',
  },
  message: {
    textAlign: 'left',
    marginBottom: '1rem',
  },
  timestamp: {
    fontSize: '0.8rem',
    color: '#555',
    marginTop: '0.25rem',
  },
  clearButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    padding: '0.6rem 1.2rem',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

export default JessyMemory;