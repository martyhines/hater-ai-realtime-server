const express = require('express');
const cors = require('cors');

const app = express();
app.disable('x-powered-by');
app.use(express.json());

// CORS: restrict to ALLOWED_ORIGIN if provided (comma-separated)
const allowed = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map(s => s.trim()).filter(Boolean)
  : null;
app.use(
  cors({
    origin: (origin, cb) => {
      if (!allowed || !origin) return cb(null, true);
      if (allowed.includes('*') || allowed.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: false,
  })
);

app.get('/health', (_req, res) => res.json({ ok: true }));

// POST /realtime-token → returns ephemeral session JSON from OpenAI Realtime
app.post('/realtime-token', async (req, res) => {
  try {
    // Optional app-level auth: set APP_AUTH_TOKEN in env and send Authorization: Bearer <token> from client
    const requiredToken = process.env.APP_AUTH_TOKEN;
    if (requiredToken) {
      const auth = req.get('authorization') || '';
      const token = auth.startsWith('Bearer ') ? auth.substring(7) : '';
      if (token !== requiredToken) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
    }

    const model = process.env.REALTIME_MODEL || 'gpt-4o-realtime-preview-2024-12-17';
    const voice = process.env.REALTIME_VOICE || 'alloy';

    const resp = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        voice,
        modalities: ['audio', 'text'],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(500).json({ error: 'OpenAI error', status: resp.status, details: text });
    }
    const data = await resp.json();
    // Return the full JSON (contains client_secret.value)
    return res.json(data);
  } catch (err) {
    console.error('Token endpoint error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`Realtime token server listening on :${port}`);
});




