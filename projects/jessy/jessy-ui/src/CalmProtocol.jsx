import React, { useState, useEffect } from 'react';

const CalmProtocol = () => {
  const [step, setStep] = useState('intro');
  const [count, setCount] = useState(4);
  const [phase, setPhase] = useState('inhale');
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    if (step === 'breathing') {
      const timer = setInterval(() => {
        setCount((prev) => {
          if (prev === 1) {
            if (phase === 'inhale') {
              setPhase('hold');
              return 4;
            } else if (phase === 'hold') {
              setPhase('exhale');
              return 4;
            } else {
              setPhase('inhale');
              setCycles((c) => c + 1);
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, phase]);

  const handleStart = () => {
    setStep('breathing');
    setPhase('inhale');
    setCount(4);
    setCycles(0);
  };

  const handleEnd = async () => {
    setStep('done');

    const payload = {
      timestamp: new Date().toISOString(),
      phase,
      duration: cycles * 12,
      notes: 'User completed Calm Protocol'
    };

    try {
      await fetch('http://localhost:5678/webhook/calm-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error('Failed to log Calm session:', err);
    }
  };

  const handleEscalate = async () => {
  const payload = {
    timestamp: new Date().toISOString(),
    user: "DemoUser",
    reason: "post-session anxious",
    message: "Escalation triggered from Calm Protocol",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f8f9fa;">
        <h2 style="color:#dc3545;">🚨 Calm Protocol Alert 🚨</h2>
        <p><b>User:</b> DemoUser</p>
        <p><b>Reason:</b> post-session anxious</p>
        <p><b>Time:</b> {{$json["body"]['timestamp']}}</p>
        <p><b>Message:</b> Escalation triggered from Calm Protocol</p>
      </div>
    `
  };

  try {
    await fetch('http://localhost:5678/webhook/calm-escalation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    alert("🚨 Escalation sent to Itzel");
  } catch (err) {
    console.error("Escalation failed:", err);
  }
};

  const handleMood = (mood) => {
    if (mood === "Anxious") {
      handleEscalate('post-session anxious');
    } else {
      alert("💙 Glad you're feeling calmer.");
    }
  };

  return (
    <div style={styles.container}>
      {step === 'intro' && (
        <>
          <h2>🧘 Calm Protocol</h2>
          <p>This short breathing exercise will help you relax.</p>
          <button onClick={handleStart} style={styles.button}>Start</button>
        </>
      )}

      {step === 'breathing' && (
        <>
          <h2>{phase.toUpperCase()}</h2>
          <div style={{ 
            ...styles.circle, 
            backgroundColor: phase === 'inhale' ? '#aee' : phase === 'hold' ? '#fea' : '#eaa' 
          }}>
            {count}
          </div>
          <button onClick={handleEnd} style={styles.button}>Finish</button>
          <button onClick={handleEscalate} style={{ ...styles.button, backgroundColor: '#dc3545' }}>
  🚨 Escalate to Itzel
</button>
        </>
      )}

      {step === 'done' && (
        <>
          <h2>🎉 Session Complete</h2>
          <p>Hope you feel calmer now.</p>
          <p>How do you feel now?</p>
          <div style={{ marginTop: "1rem" }}>
            <button onClick={() => handleMood("Calm")} style={styles.button}>😊 Calm</button>
            <button onClick={() => handleMood("Anxious")} style={styles.dangerButton}>😟 Still Anxious</button>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    textAlign: 'center',
    marginTop: '2rem',
  },
  circle: {
    margin: '1rem auto',
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    fontSize: '2rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    animation: 'pulse 4s infinite ease-in-out',
  },
  button: {
    marginTop: '1rem',
    padding: '0.8rem 1.5rem',
    fontSize: '1rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#28a745',
    color: 'white',
    cursor: 'pointer',
    marginRight: '0.5rem'
  },
  dangerButton: {
    marginTop: '1rem',
    padding: '0.8rem 1.5rem',
    fontSize: '1rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#dc3545',
    color: 'white',
    cursor: 'pointer',
    marginLeft: '0.5rem'
  }
};

export default CalmProtocol;