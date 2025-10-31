import React, { useState, useEffect } from 'react';

const JessyOpponent = () => {
  const [topic, setTopic] = useState('');
  const [currentTopic, setCurrentTopic] = useState('');
  const [response, setResponse] = useState('');
  const [exchange, setExchange] = useState([]);
  const [pastTopics, setPastTopics] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load past debates on mount
  useEffect(() => {
    const fetchDebates = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/debates');
        const debates = await res.json();
        setExchange(debates.map(d => ({ user: d.user_message, reply: d.jessy_reply })));
        setPastTopics([...new Set(debates.map(d => d.topic))]);
      } catch (err) {
        console.error('❌ Failed to fetch debates:', err);
      }
    };
    fetchDebates();
  }, []);

  const handleDebate = async () => {
    if (!topic && !currentTopic) return alert('Please select or enter a topic.');
    if (!response && currentTopic) return alert('Please enter a response.');
    
    setLoading(true);
    const debateTopic = currentTopic || topic;
    const userInput = response || topic;

    try {
      const res = await fetch('http://localhost:5000/opponent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: debateTopic, history: [...exchange, { user: userInput, reply: '' }] }),
      });
      const data = await res.json();
      if (res.ok) {
        setExchange([...exchange, { user: userInput, reply: data.reply }]);
        if (!currentTopic) {
          setCurrentTopic(topic);
          setPastTopics([...new Set([...pastTopics, topic])]);
        }
        setTopic('');
        setResponse('');
      } else {
        setExchange([...exchange, { user: userInput, reply: `⚠️ Error: ${data.error || 'Server error'}` }]);
      }
    } catch (err) {
      setExchange([...exchange, { user: userInput, reply: `⚠️ Error: ${err.message}` }]);
    }
    setLoading(false);
  };

  const handleClearDebate = async () => {
    try {
      await fetch('http://localhost:5000/api/debates', { method: 'DELETE' });
      setExchange([]);
      setPastTopics([]);
      setCurrentTopic('');
      setTopic('');
      setResponse('');
      alert('Debate history cleared.');
    } catch (err) {
      alert(`❌ Failed to clear debate history: ${err.message}`);
    }
  };

  const handleTopicSelect = (selectedTopic) => {
    setCurrentTopic(selectedTopic);
    setExchange(pastTopics.length > 0 
      ? exchange.filter(e => pastTopics.includes(e.user) && e.user === selectedTopic)
      : []);
    setTopic('');
    setResponse('');
  };

  return (
    <div style={styles.container}>
      <h2>⚖️ The Opponent: Intellectual Sparring</h2>
      <p>Enter a topic or continue a debate. Jessy will challenge your assumptions.</p>

      <div style={styles.controls}>
        <select
          value={currentTopic}
          onChange={(e) => handleTopicSelect(e.target.value)}
          style={styles.input}
        >
          <option value="">Select a past topic...</option>
          {pastTopics.map((t, idx) => (
            <option key={idx} value={t}>{t}</option>
          ))}
        </select>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a new topic..."
          style={styles.input}
          disabled={currentTopic}
        />
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder={currentTopic ? "Respond to Jessy..." : "Start with a topic first"}
          style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }}
          disabled={!currentTopic}
        />
        <button
          onClick={handleDebate}
          style={styles.button}
          disabled={loading || (!topic && !response)}
        >
          {loading ? 'Debating...' : 'Debate'}
        </button>
        <button
          onClick={handleClearDebate}
          style={{ ...styles.button, backgroundColor: '#e74c3c' }}
        >
          Clear Debate
        </button>
      </div>

      <div style={styles.chatBox}>
        {exchange.length === 0 && <p>No debates yet. Start one above!</p>}
        {exchange.map((e, idx) => (
          <div key={idx}>
            <p><strong>You:</strong> {e.user}</p>
            <p><strong>Jessy (Opponent):</strong> {e.reply}</p>
            <hr />
          </div>
        ))}
      </div>
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
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    padding: '0.8rem',
    borderRadius: '6px',
    minWidth: '400px',
  },
  button: {
    padding: '0.8rem 1.5rem',
    borderRadius: '6px',
    backgroundColor: '#8e44ad',
    color: 'white',
    border: 'none',
  },
};

export default JessyOpponent;