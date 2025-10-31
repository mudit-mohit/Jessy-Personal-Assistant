const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { spawn } = require('child_process');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { v4: uuidv4 } = require('uuid');
const fetch =  require("node-fetch");

dotenv.config();

const app = express();
const PORT = 5000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Cross-platform DB path
const dbPath = '/Users/appdev/Downloads/jessy-core/real-jessy.db';
const db = new Database(dbPath);

// Set SQLCipher passphrase from .env
db.pragma(`key = '${process.env.SQLCIPHER_PASSPHRASE}'`);

// Middleware
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

const PIPER_BIN = '/Users/appdev/Downloads/jessy-core/piper/build/piper';
const VOICE_MODEL = '/Users/appdev/Downloads/jessy-core/piper/en_US-amy-medium.onnx';
const ESPEAK_DATA = '/usr/local/opt/espeak-ng/share/espeak-ng-data';

function runPiperTTS(text) {
  return new Promise((resolve, reject) => {
    const outputFile = path.resolve(__dirname, `tts-output-${uuidv4()}.wav`);
    const cmd = `echo "${text.replace(/"/g, '\\"')}" | "${PIPER_BIN}" --model "${VOICE_MODEL}" --espeak-data "${ESPEAK_DATA}" --output_file "${outputFile}"`;
    console.log("🔊 Piper command:", cmd);

    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error("❌ Piper exec error:", err.message, stderr);
        return reject(err);
      }
      console.log("✅ Piper TTS generated:", outputFile);
      resolve(outputFile);
    });
  });
}

// Ensure tables exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS vitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    glucose REAL,
    bp TEXT,
    oxygen REAL,
    bodyTemp REAL,
    weight REAL,
    mood TEXT,
    pain TEXT,
    notes TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT,
    message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS emergency_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS debates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT,
  user_message TEXT,
  jessy_reply TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// ========================== API ROUTES ==========================

// Fetch vitals
app.get('/api/vitals', (req, res) => {
  const rows = db.prepare('SELECT * FROM vitals ORDER BY timestamp DESC').all();
  console.log("Vitals rows from DB:", rows);
  res.json(rows);
});

// Insert vitals
app.post('/api/vitals', (req, res) => {
  console.log('Vitals POST body:', req.body);
  const { glucose, bp, oxygen, bodyTemp, weight, mood, pain, notes } = req.body;
  try {
    db.prepare(`
      INSERT INTO vitals (glucose, bp, oxygen, bodyTemp, weight, mood, pain, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(glucose, bp, oxygen, bodyTemp, weight, mood, pain, notes);
    res.json({ message: 'Vitals saved successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch chats
app.get('/api/chats', (req, res) => {
  const rows = db.prepare('SELECT * FROM chats ORDER BY id ASC').all();
  res.json(rows);
});

// Clear chats
app.delete('/api/chats', (req, res) => {
  db.prepare('DELETE FROM chats').run();
  res.json({ message: 'Chat history cleared.' });
});

const { GoogleAuth } = require("google-auth-library");
const { text } = require('stream/consumers');

// Retry logic for Gemini API
async function tryGenerateContent(prompt, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: "POST",
        headers: { 
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();  // Parse error details
        console.error('Groq API error response:', errorData);
        throw new Error(`HTTP error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Groq full response:', data);
      const text = data.choices[0]?.message?.content || "No response generated.";
      if (attempt < retries && (text.includes('unavailable') || text.includes('offline'))) {
        console.log(`Retrying due to low-quality response (attempt ${attempt})`);
        continue;
      }  // Log for debugging
      return text;
    } catch (error) {
      console.error(`Groq error (attempt ${attempt}):`, error);
      if (attempt === retries) return "Service temporarily unavailable";
    }
  }
}

// Jessy Clone with memory + fallback
app.post('/clone', async (req, res) => {
  console.log('Raw request body:', req.body);  // Log raw body for debugging
  const prompt = req.body.prompt;

  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    console.error('❌ Invalid prompt:', prompt);
    throw new Error('incomplete input');
  }
  console.log('[Clone Prompt]', prompt);

  const logToDB = (sender, message) => {
    try {
      db.prepare('INSERT INTO chats (sender, message) VALUES (?, ?)').run(sender, message);
      console.log(`Logged to DB: ${sender} - ${message}`);
    } catch (dbError) {
      console.error('DB log error:', dbError.message);
    }
  };

  try {
    const rows = db.prepare(`
      SELECT sender, message 
      FROM chats 
      WHERE message NOT LIKE '%unavailable%' 
        AND message NOT LIKE '%offline%'
      ORDER BY id DESC 
      LIMIT 5
    `).all();
    console.log('DB rows fetched successfully:', rows);

    const context = rows.reverse().map(row => `${row.sender}: ${row.message}`).join('\n');
    const fullPrompt = `You are Jessy, a friendly and helpful assistant. Respond naturally and conversationally to the user's input, avoiding technical error messages or repeating the user's prompt unless necessary. Use the following conversation history for context:

${context}

You: ${prompt}
Jessy:`;

    const text = await tryGenerateContent(fullPrompt);
    console.log('Groq response text:', text);

    if (text.includes('unavailable') || text.includes('offline') || text.includes(prompt)) {
      throw new Error('Low-quality response from Groq');
    }

    logToDB('You', prompt);
    logToDB('Jessy', text);
    res.json({ reply: text });
  } catch (error) {
    console.error('❌ Clone endpoint error:', error.message);
    const fallbackReply = `⚠️ Jessy is temporarily unavailable due to server overload. Please try again in a few minutes.\n\nYou said: "${prompt}"`;
    logToDB('You', prompt);
    logToDB('Jessy', fallbackReply);
    res.json({ reply: fallbackReply });
  }
});

app.post('/api/speech-to-text', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio uploaded' });
  }

  const inputPath = path.resolve(req.file.path);
  const whisperBin = path.resolve(__dirname, './whisper.cpp/build/bin/whisper-cli');
  const modelPath = path.resolve(__dirname, './whisper.cpp/models/ggml-base.en.bin');

  if (!fs.existsSync(modelPath)) {
    fs.unlinkSync(inputPath);
    return res.status(500).json({ error: '❌ Whisper model file not found.' });
  }

  console.log("🎤 Received audio:", inputPath);

  // 🔹 ffmpeg → outputs raw wav to stdout
  const ffmpeg = spawn("ffmpeg", [
    "-i", inputPath,
    "-ar", "16000",
    "-ac", "1",
    "-c:a", "pcm_s16le",
    "-f", "wav",
    "pipe:1"
  ]);

  // 🔹 whisper-cli → reads from stdin, outputs JSON
  const whisper = spawn(whisperBin, [
    "-m", modelPath,
    "-f", "-",
    "--output-json",
    "-l", "en",
    "--no-gpu"
  ]);

  // Pipe audio from ffmpeg → whisper
  ffmpeg.stdout.pipe(whisper.stdin);

  let whisperStdout = "";
  let whisperStderr = "";

  whisper.stdout.on("data", (chunk) => whisperStdout += chunk.toString());
  whisper.stderr.on("data", (chunk) => whisperStderr += chunk.toString());

  whisper.on("close", (code) => {
    console.log("🔄 Whisper exited with:", code);
    console.log("📝 Whisper stderr:", whisperStderr);

    try {
      const parsed = JSON.parse(whisperStdout.trim());
      const transcription = parsed.transcription?.map(seg => seg.text).join(" ") || "";
      console.log("✅ Transcription:", transcription);

      res.json({
        text: transcription,
        confidence: parsed.transcription?.[0]?.confidence || null
      });
    } catch (err) {
      console.error("❌ Failed to parse Whisper JSON:", err.message);
      res.status(500).json({ error: "Whisper JSON parse failed", raw: whisperStdout });
    }

    fs.unlink(inputPath, () => {});
  });

  ffmpeg.on("error", (err) => {
    console.error("❌ FFmpeg error:", err.message);
    fs.unlink(inputPath, () => {});
    res.status(500).json({ error: "FFmpeg failed" });
  });
});

app.get('/tts', async (req, res) => {
  const text = req.query.text;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    console.log('Running Piper TTS with text:', text);
    const file = await runPiperTTS(text);
    if (!fs.existsSync(file)) {
      console.error('❌ TTS output file not found:', file);
      throw new Error('TTS output file not generated');
    }
    res.setHeader('Content-Type', 'audio/wav');
    res.sendFile(file, (err) => {
      if (err) {
        console.error('❌ TTS file send error:', err.message);
        res.status(500).json({ error: 'Failed to send TTS audio', text });
      } else {
        // Clean up TTS file after sending
        fs.unlink(file, (err) => {
          if (err) console.error('❌ Failed to delete TTS file:', err.message);
        });
      }
    });
  } catch (err) {
    console.error('❌ TTS error:', err.message);
    res.status(500).json({ error: `TTS failed: ${err.message}`, text });
  }
});

// Socratic Opponent
app.post('/opponent', async (req, res) => {
  const { topic, history } = req.body;
  console.log('[Opponent Topic]', topic, '[History]', history);

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  try {
    // Build conversation context from history
    const context = history
      ? history.map(({ user, reply }) => `User: ${user}\nJessy: ${reply}`).join('\n')
      : '';
    const prompt = `${context}\nEngage in a Socratic debate on the topic: "${topic}". Respectfully challenge the user's assumptions with probing questions. Respond to the user's latest input: "${history ? history[history.length - 1]?.user : topic}".`;

    const text = await tryGenerateContent(prompt);

    // Save to debates table
    db.prepare(
      `INSERT INTO debates (topic, user_message, jessy_reply)
      VALUES (?, ?, ?)`
    ).run(topic, history ? history[history.length - 1]?.user : topic, text);

    res.json({ reply: text });
  } catch (err) {
    console.error('❌ Opponent error:', err.message);
    res.status(500).json({ reply: 'Jessy Opponent unavailable.' });
  }
});

// Fetch debates
app.get('/api/debates', (req, res) => {
  const rows = db.prepare('SELECT * FROM debates ORDER BY id ASC').all();
  res.json(rows);
});

// Clear debates
app.delete('/api/debates', (req, res) => {
  db.prepare('DELETE FROM debates').run();
  res.json({ message: 'Debate history cleared.' });
});

// Accept user feedback
app.post('/api/feedback', (req, res) => {
  const { feedback } = req.body;
  if (!feedback) return res.status(400).json({ error: 'Feedback required.' });

  db.prepare('INSERT INTO feedback (message) VALUES (?)').run(feedback);
  res.json({ message: 'Feedback received!' });
});

// Get feedback list
app.get('/api/feedbacks', (req, res) => {
  const rows = db.prepare('SELECT id, message, timestamp FROM feedback ORDER BY id DESC').all();
  res.json(rows);
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ API running at http://localhost:${PORT}`);
});