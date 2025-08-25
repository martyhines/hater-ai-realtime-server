const express = require('express');
const cors = require('cors');
try { require('dotenv').config(); } catch (_e) {}

const app = express();
app.disable('x-powered-by');
app.use(express.json());

// Simple in-memory rate limiter per IP
const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const rateLimitMax = Number(process.env.RATE_LIMIT_RPM || 30); // requests per window
const requestsByIp = new Map(); // ip -> number[] (timestamps)

function isRateLimited(ip) {
  const now = Date.now();
  const windowStart = now - rateLimitWindowMs;
  const arr = requestsByIp.get(ip) || [];
  const recent = arr.filter(ts => ts > windowStart);
  recent.push(now);
  requestsByIp.set(ip, recent);
  return recent.length > rateLimitMax;
}

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

// POST /v1/chat → proxies Chat Completions to OpenAI with app-level auth
app.post('/v1/chat', async (req, res) => {
  try {
    // Optional app-level auth
    const requiredToken = process.env.APP_AUTH_TOKEN;
    if (requiredToken) 
    {
      const auth = req.get('authorization') || '';
      const token = auth.startsWith('Bearer ') ? auth.substring(7) : '';
      if (token !== requiredToken) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    // Rate limit per IP
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.ip || 'unknown';
    if (isRateLimited(ip)) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please slow down.' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
    }

    // Basic payload validation/sanitization
    const {
      model = 'gpt-3.5-turbo',
      messages = [],
      max_tokens = 300,
      temperature = 0.8,
      top_p = 0.9,
      frequency_penalty = 0.3,
      presence_penalty = 0.3,
    } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    // Limit messages length to prevent abuse
    const safeMessages = messages
      .slice(-20)
      .map(m => ({
        role: String(m.role || '').slice(0, 32),
        content: typeof m.content === 'string' ? m.content.slice(0, 4000) : '',
      }));

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: safeMessages,
        max_tokens,
        temperature,
        top_p,
        frequency_penalty,
        presence_penalty,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: 'OpenAI error', status: resp.status, details: text });
    }

    const data = await resp.json();
    // Return the OpenAI-shaped response so clients can parse as usual
    return res.json(data);
  } catch (err) {
    console.error('Chat endpoint error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`Realtime token server listening on :${port}`);
});




