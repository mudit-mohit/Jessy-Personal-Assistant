import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import VitalsDashboard from './VitalsDashboard';
import HealthMonitor from './HealthMonitor';
import VitalsChart from './VitalsChart';
import CalmProtocol from './CalmProtocol';
import JessyClone from './JessyClone';
import JessyMemory from './JessyMemory';
import JessyOpponent from './JessyOpponent';
import JessyDashboardOverview from './JessyDashboardOverview';
import JessyFeedback from './JessyFeedback';
import Navbar from './components/Navbar';
import JessyFeedbackReview from './JessyFeedbackReview';
import CalmLogs from './CalmLogs';
import VitalsLogs from './VitalsLogs';
import CalmAnalytics from './CalmAnalytics';
import './index.css';

function Home() {
  const navigate = useNavigate();
  const [emergencyVitals, setEmergencyVitals] = useState(null);

  const handleEmergency = async () => {
    const payload = {
      timestamp: new Date().toISOString(),
      message: 'Emergency triggered by user',
    };

    try {
      // Trigger n8n webhook for email and logging
      const webhookRes = await fetch('http://localhost:5678/webhook/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Fetch latest vitals from server
      const vitalsRes = await fetch('http://localhost:5000/api/vitals', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (webhookRes.ok && vitalsRes.ok) {
        const vitalsData = await vitalsRes.json();
        const latestVitals = vitalsData[0] || null; // Get the most recent vitals (first entry)
        setEmergencyVitals(latestVitals);
        alert('🚨 Emergency alert sent and vitals retrieved!');
      } else {
        const errorMsg = !webhookRes.ok
          ? 'Failed to send emergency alert'
          : 'Failed to retrieve vitals';
        alert(`❌ ${errorMsg}.`);
      }
    } catch (err) {
      alert(`❌ Error processing emergency: ${err.message}`);
    }
  };

  return (
    <div className="home-container">
      <h1 className="home-title">🧠 Jessy Assistant</h1>
      <p className="home-subtitle">Your Intelligent Health & Mental Wellness Companion</p>

      <div className="home-buttons">
        <button onClick={() => navigate('/health')}>🩺 Health Monitor</button>
        <button onClick={() => navigate('/vitals')}>📊 Vitals Dashboard</button>
        <button onClick={() => navigate('/charts')}>📈 Vitals Trend Chart</button>
        <button onClick={() => navigate('/calm')}>🧘 Calm Protocol</button>
        <button onClick={() => navigate('/clone')}>💬 Jessy Clone</button>
        <button onClick={() => navigate('/opponent')}>⚖️ Opponent Debate</button>
        <button onClick={() => navigate('/memory')}>🧠 Memory</button>
        <button onClick={() => navigate('/feedback')}>💬 Feedback</button>
        <button onClick={handleEmergency} className="emergency-button">🚨 Emergency</button>
      </div>

      {emergencyVitals && (
        <div
          className="emergency-vitals"
          style={{
            marginTop: '1rem',
            padding: '1rem',
            border: '1px solid #ff512f',
            borderRadius: '8px',
            backgroundColor: '#fff3cd',
          }}
        >
          <h3>Critical Medical Information</h3>
          <p><strong>Glucose:</strong> {emergencyVitals.glucose || 'N/A'} mg/dL</p>
          <p><strong>Blood Pressure:</strong> {emergencyVitals.bp || 'N/A'}</p>
          <p><strong>Oxygen:</strong> {emergencyVitals.oxygen || 'N/A'}%</p>
          <p><strong>Body Temperature:</strong> {emergencyVitals.bodyTemp || 'N/A'}°F</p>
          <p><strong>Weight:</strong> {emergencyVitals.weight || 'N/A'} lbs</p>
          <p><strong>Mood:</strong> {emergencyVitals.mood || 'N/A'}</p>
          <p><strong>Pain:</strong> {emergencyVitals.pain || 'N/A'}</p>
          <p><strong>Notes:</strong> {emergencyVitals.notes || 'N/A'}</p>
          <p><strong>Timestamp:</strong> {emergencyVitals.timestamp || 'N/A'}</p>
        </div>
      )}

      <div className="home-footer">
        <span>
          Made with <span style={{ color: '#ff512f' }}>❤️</span> by Jessy Team
        </span>
      </div>
    </div>
  );
}

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/health" element={<HealthMonitor />} />
        <Route path="/vitals" element={<VitalsDashboard />} />
        <Route path="/charts" element={<VitalsChart />} />
        <Route path="/calm" element={<CalmProtocol />} />
        <Route path="/clone" element={<JessyClone />} />
        <Route path="/memory" element={<JessyMemory />} />
        <Route path="/opponent" element={<JessyOpponent />} />
        <Route path="/dashboard" element={<JessyDashboardOverview />} />
        <Route path="/feedback" element={<JessyFeedback />} />
        <Route path="/review-feedback" element={<JessyFeedbackReview />} />
        <Route path="/calmlogs" element={<CalmLogs />} />
        <Route path="/vitals-logs" element={<VitalsLogs />} />
        <Route path="/calm-analytics" element={<CalmAnalytics />} />
        <Route path="*" element={<h2 style={{ textAlign: 'center', padding: '2rem', color: '#ff512f' }}>🔍 Page Not Found</h2>} />
      </Routes>
    </>
  );
}

export default App;