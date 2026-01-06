import React, { useState } from 'react';

function HealthMonitor() {
  const [form, setForm] = useState({
    glucose: '',
    bp: '',
    oxygen: '',
    bodyTemperature: '',
    weight: '',
    pain: '',
    mood: '',
    notes: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      timestamp: new Date().toISOString(),
    };

    let dbSuccess = false;
    let n8nSuccess = false;

    try {
      // 1. Send to your backend (SQLite)
      const dbRes = await fetch('http://localhost:5678/webhook-test/health-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      dbSuccess = dbRes.ok;
    } catch (error) {
      console.error('Backend submission error:', error);
    }
    
    try {
      // 2. Send to n8n Google Sheets webhook
      const n8nRes = await fetch('http://localhost:5678/webhook-test/get-vitals-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      n8nSuccess = n8nRes.ok;
    } catch (error) {
      console.error('n8n submission error:', error);
    }

      if (dbSuccess || n8nSuccess) {
        alert('✅ Vitals submitted and logged!');
        setForm({
          glucose: '',
          bp: '',
          oxygen: '',
          bodyTemperature: '',
          weight: '',
          pain: '',
          mood: '',
          notes: '',
        });
      } else {
        alert('❌ Submission failed on both endpoints.');
      }
    };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>🩺 Log Health Vitals</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', margin: 'auto' }}
      >
        <input name="glucose" placeholder="Glucose (mg/dL)" value={form.glucose} onChange={handleChange} />
        <input name="bp" placeholder="Blood Pressure (e.g. 120/80)" value={form.bp} onChange={handleChange} />
        <input name="oxygen" placeholder="Oxygen Level (%)" value={form.oxygen} onChange={handleChange} />
        <input name="bodyTemperature" placeholder="Body Temperature (°C)" value={form.bodyTemperature} onChange={handleChange} />
        <input name="weight" placeholder="Weight (kg)" value={form.weight} onChange={handleChange} />

        <select name="pain" value={form.pain} onChange={handleChange}>
          <option value="">Pain/Discomfort (0-10)</option>
          {[...Array(11).keys()].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        <select name="mood" value={form.mood} onChange={handleChange}>
          <option value="">Mood</option>
          {["Happy", "Neutral", "Sad", "Anxious", "Angry"].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <textarea name="notes" placeholder="Notes or Symptoms" value={form.notes} onChange={handleChange} />
        <button type="submit" style={{ padding: '0.8rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px' }}>
          Submit
        </button>
      </form>
    </div>
  );
}

export default HealthMonitor;