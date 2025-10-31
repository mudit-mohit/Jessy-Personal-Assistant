import React, { useState } from 'react';

const JessyFeedback = () => {
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async () => {
    if (!feedback.trim()) return;
    try {
      const res = await fetch('http://localhost:5000/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
      const data = await res.json();
      setStatus(data.message || '✅ Submitted');
      setFeedback('');
    } catch (err) {
      setStatus('❌ Failed to submit');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: 'auto' }}>
      <h2>💬 Jessy Feedback</h2>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Tell us what you think..."
        rows="5"
        style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
      />
      <br />
      <button onClick={handleSubmit}>Submit Feedback</button>
      <p>{status}</p>
    </div>
  );
};

export default JessyFeedback;