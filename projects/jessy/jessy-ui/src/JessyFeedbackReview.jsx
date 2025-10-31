import React, { useEffect, useState } from 'react';

const JessyFeedbackReview = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/feedbacks')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => setFeedbacks(data))
      .catch((err) => {
        console.error('Feedback fetch error:', err);
        setError(true);
      });
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: 'auto' }}>
      <h2>📝 Jessy Feedback</h2>
      {error ? (
        <p style={{ color: 'red' }}>⚠️ Could not load feedback entries.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }} border="1" cellPadding="10">
          <thead>
            <tr>
              <th>ID</th>
              <th>Feedback</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.length > 0 ? (
              feedbacks.map((fb) => (
                <tr key={fb.id}>
                  <td>{fb.id}</td>
                  <td>{fb.message}</td>
                  <td>{fb.timestamp}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center' }}>No feedback found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default JessyFeedbackReview;