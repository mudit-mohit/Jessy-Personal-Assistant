import React, { useState, useEffect, useRef } from 'react';

const JessyClone = () => {
  const [messages, setMessages] = useState([]); 
  const [input, setInput] = useState(''); 
  const [loading, setLoading] = useState(false); 
  const [recording, setRecording] = useState(false); 
  const [audioLevel, setAudioLevel] = useState(0); 
  const mediaRecorderRef = useRef(null); 
  const audioChunksRef = useRef([]); 
  const audioContextRef = useRef(null); 
  const analyserRef = useRef(null); 
  const microphoneRef = useRef(null);

  // Fetch chat history on mount
  useEffect(() => { 
    fetch('http://localhost:5000/api/chats') 
      .then(res => res.json()) 
      .then(data => setMessages(data)) 
      .catch(err => console.error('Failed to load chat history:', err)); 
  }, []); 
  
  const sendMessage = async (text = input) => {
    if (!text.trim()) return; 
    
    const userMessage = { sender: 'You', message: text }; 
    setMessages(prev => [...prev, userMessage]); 
    setInput(''); 
    setLoading(true); 
    
    try { 
      const res = await fetch('http://localhost:5000/clone', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ prompt: text }) 
      }); 
      
      const data = await res.json(); 
      let botReply = data.reply || 'Hmm, no reply.'; 
      
      await speakReply(botReply); 
      
      const botMessage = { sender: 'Jessy', message: botReply }; 
      setMessages(prev => [...prev, botMessage]); 
    } catch (err) { 
      setMessages(prev => [...prev, { sender: 'Jessy', message: 'Error reaching server.' }]); 
    } 
    
    setLoading(false); 
  }; 
  
  const clearHistory = async () => { 
    const confirmClear = window.confirm('Are you sure you want to clear all chat history?'); 
    if (!confirmClear) return; 
    
    try { 
      await fetch('http://localhost:5000/api/chats', { method: 'DELETE' }); 
      setMessages([]); 
    } catch (err) { 
      alert('Failed to clear chat history.'); 
    } 
  }; 
  
  const setupAudioAnalysis = async (stream) => { 
    if (audioContextRef.current) { 
      audioContextRef.current.close(); 
    }
    
    audioContextRef.current = new AudioContext(); 
    analyserRef.current = audioContextRef.current.createAnalyser(); 
    microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream); 
    
    microphoneRef.current.connect(analyserRef.current); 
    analyserRef.current.fftSize = 256; 
    
    const bufferLength = analyserRef.current.frequencyBinCount; 
    const dataArray = new Uint8Array(bufferLength); 
    
    const analyzeAudio = () => { 
      if (!analyserRef.current) return; 
      
      analyserRef.current.getByteFrequencyData(dataArray); 
      let sum = 0; 
      for (let i = 0; i < bufferLength; i++) { 
        sum += dataArray[i]; 
      } 
      const average = sum / bufferLength; 
      setAudioLevel(average); 
      
      if (recording) { 
        requestAnimationFrame(analyzeAudio); 
      } 
    }; 
    
    analyzeAudio(); 
  }; 
  
  const toggleRecording = async () => { 
    if (!recording) { 
      try { 
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: true, 
            noiseSuppression: true, 
            sampleRate: 16000, 
            channelCount: 1 
          } 
        }); 
        
        await setupAudioAnalysis(stream); 
        
        const mediaRecorder = new MediaRecorder(stream, { 
          mimeType: 'audio/webm;codecs=opus', 
          audioBitsPerSecond: 256000 
        }); 
        
        mediaRecorderRef.current = mediaRecorder; 
        audioChunksRef.current = []; 
        
        mediaRecorder.ondataavailable = (e) => { 
          if (e.data.size > 0) { 
            audioChunksRef.current.push(e.data); 
          } 
        }; 
        
        mediaRecorder.onstop = async () => { 
          if (audioContextRef.current) { 
            audioContextRef.current.close(); 
            audioContextRef.current = null; 
          } 
          setAudioLevel(0); 
          
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); 
          console.log("🎤 Recorded blob size:", blob.size, "bytes"); 
          
          try { 
            const audioUrl = URL.createObjectURL(blob); 
            const audio = new Audio(audioUrl); 
            audio.volume = 1.0; 
            setMessages(prev => [...prev, { 
              sender: 'Jessy', 
              message: 'Playing back your recording for verification...' 
            }]); 
            await audio.play(); 
          } catch (e) { 
            console.log("Could not play audio:", e); 
            setMessages(prev => [...prev, { 
              sender: 'Jessy', 
              message: 'Failed to play back recording.' 
            }]); 
          } 
          
          const formData = new FormData(); 
          formData.append('audio', blob, 'speech.webm'); 
          
          try { 
            const res = await fetch('http://localhost:5000/api/speech-to-text', { 
              method: 'POST', 
              body: formData, 
            }); 
            
            if (!res.ok) { 
              throw new Error(`HTTP error! status: ${res.status}`); 
            } 
            
            const data = await res.json(); 
            console.log("🎤 STT Response:", data); 
            
            if (data.text && data.text.trim().length > 0 && data.text.trim().toLowerCase() !== 'hold') { 
              if (data.confidence && data.confidence < 0.7) { 
                setMessages(prev => [...prev, { 
                  sender: 'Jessy', 
                  message: `Transcription "${data.text}" has low confidence (${(data.confidence * 100).toFixed(1)}%). Please speak clearly or try a quieter environment.` 
                }]); 
              } else { 
                sendMessage(data.text); 
              } 
            } else { 
              setMessages(prev => [...prev, { 
                sender: 'Jessy', 
                message: 'I didn\'t catch that clearly. Please speak louder, closer to the microphone, or try a quieter environment.' 
              }]); 
            } 
          } catch (err) { 
            console.error("STT error:", err); 
            setMessages(prev => [...prev, { 
              sender: 'Jessy', 
              message: `Speech recognition failed: ${err.message}. Please try again in a quiet environment.` 
            }]); 
          } 
        }; 
        
        setTimeout(() => { 
          if (mediaRecorder.state !== 'recording') { 
            mediaRecorder.start(100); 
            setRecording(true); 
          } 
        }, 100); 
        
        setTimeout(() => { 
          if (recording && mediaRecorderRef.current?.state === 'recording') { 
            mediaRecorderRef.current.stop(); 
            setRecording(false); 
          } 
        }, 15000); 
    
      } catch (err) { 
        console.error('Failed to start recording:', err); 
        setMessages(prev => [...prev, { 
          sender: 'Jessy', 
          message: 'Microphone access denied. Please allow microphone permissions.' 
        }]); 
      } 
    } else { 
      if (mediaRecorderRef.current?.state === 'recording') { 
        mediaRecorderRef.current.stop(); 
      } 
      setRecording(false); 
      setAudioLevel(0); 
    } 
  }; 

  const speakReply = async (text) => { 
    try { 
      const res = await fetch(`http://localhost:5000/tts?text=${encodeURIComponent(text)}`, { 
        method: 'GET', 
      }); 
      
      if (!res.ok) { 
        throw new Error(`TTS HTTP error! status: ${res.status}`); 
      } 
      
      const audioBlob = await res.blob(); 
      const audioUrl = URL.createObjectURL(audioBlob); 
      const audio = new Audio(audioUrl); 
      audio.volume = 1.0; 
      
      audio.onended = () => { 
        URL.revokeObjectURL(audioUrl); 
      }; 
      
      await audio.play(); 
    } catch (err) { 
      console.error('TTS failed:', err); 
      setMessages(prev => [...prev, { 
        sender: 'Jessy', 
        message: `Failed to generate speech: ${err.message}. Please try again.` 
      }]); 
    } 
  }; 

  // Audio level warning
  useEffect(() => { 
    if (recording && audioLevel < 20) { 
      setMessages(prev => [...prev, { 
        sender: 'Jessy', 
        message: 'Your microphone input is too quiet. Speak louder or closer to the microphone.' 
      }]); 
    } 
  }, [audioLevel, recording]); 

  // Clean up on unmount
  useEffect(() => { 
    return () => { 
      if (audioContextRef.current) { 
        audioContextRef.current.close(); 
      } 
    }; 
  }, []); 

  return ( 
    <div style={styles.container}> 
      <h2>🧬 Talk to Jessy</h2> 
      <div style={styles.chatBox}> 
        {messages.map((msg, i) => ( 
          <div key={i} style={msg.sender === 'Jessy' ? styles.bot : styles.user}> 
            <strong>{msg.sender}:</strong> {msg.message} 
          </div> 
        ))} 
      </div> 
        
      <div style={styles.controls}> 
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Type your question..." 
          style={styles.input} 
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()} 
        />
        <button 
          onClick={() => sendMessage()} 
          style={styles.button} 
          disabled={loading}
        > 
          {loading ? '...' : 'Send'} 
        </button> 
        <button 
          onClick={clearHistory} 
          style={{ ...styles.button, backgroundColor: '#dc3545' }}
        > 
          🗑️ Clear Chat 
        </button> 
        <button 
          onClick={toggleRecording} 
          style={{ 
            ...styles.button, 
            backgroundColor: recording ? '#ffc107' : '#28a745', 
            position: 'relative' 
          }} 
        > 
          {recording ? '⏹️ Stop' : '🎙️ Speak'} 
          {recording && ( 
            <div style={styles.audioMeter}> 
              <div 
                style={{ 
                  ...styles.audioLevel, 
                  width: `${Math.min(audioLevel * 2, 100)}%`, 
                  backgroundColor: audioLevel > 20 ? '#28a745' : '#ffc107' 
                }} 
              /> 
            </div> 
          )} 
        </button> 
      </div> 
            
      {recording && ( 
        <div style={styles.recordingInfo}> 
          <p>🎤 Recording... Speak clearly into your microphone</p> 
          <p>Audio level: {Math.round(audioLevel)}</p> 
        </div> 
      )} 
    </div> 
  ); 
}; 
            
const styles = { 
  container: { 
    padding: '2rem', 
    maxWidth: '600px', 
    margin: 'auto', 
    textAlign: 'center' 
  }, 
  chatBox: { 
    height: '300px', 
    overflowY: 'auto', 
    border: '1px solid #ccc', 
    padding: '1rem', 
    marginBottom: '1rem', 
    borderRadius: '8px', 
    backgroundColor: '#fefefe' 
  }, 
  user: { textAlign: 'right', marginBottom: '0.5rem' }, 
  bot: { textAlign: 'left', marginBottom: '0.5rem' }, 
  controls: { 
    display: 'flex', 
    gap: '0.5rem', 
    flexWrap: 'wrap', 
    justifyContent: 'center', 
    alignItems: 'center' 
  }, 
  input: { 
    flex: 1, 
    padding: '0.8rem', 
    borderRadius: '6px', 
    minWidth: '200px' 
  }, 
  button: { 
    padding: '0.8rem 1rem', 
    borderRadius: '6px', 
    backgroundColor: '#007bff', 
    color: 'white', 
    border: 'none', 
    minWidth: '100px', 
    position: 'relative' 
  }, 
  audioMeter: { 
    position: 'absolute', 
    bottom: '2px', 
    left: '5px', 
    right: '5px', 
    height: '3px', 
    backgroundColor: '#ddd', 
    borderRadius: '2px' 
  }, 
  audioLevel: { 
    height: '100%', 
    borderRadius: '2px', 
    transition: 'width 0.1s ease' 
  }, 
  recordingInfo: { 
    marginTop: '1rem', 
    padding: '0.5rem', 
    backgroundColor: '#fff3cd', 
    border: '1px solid #ffeaa7', 
    borderRadius: '4px' 
  } 
}; 

export default JessyClone;