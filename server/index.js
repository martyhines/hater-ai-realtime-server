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

// POST /v1/chat → tries Gemini first, falls back to OpenAI
app.post('/v1/chat', async (req, res) => {
  try {
    // Optional app-level auth
    const requiredToken = process.env.APP_AUTH_TOKEN;
    if (requiredToken) {
      const auth = req.get('authorization') || '';
      const token = auth.startsWith('Bearer ') ? auth.substring(7) : '';
      const safe = (s) => (s ? `${s.slice(0, 4)}...${s.slice(-4)}` : '');
      if (token !== requiredToken) {
        console.warn('[chat] unauthorized request');
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    // Rate limit per IP
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.ip || 'unknown';
    if (isRateLimited(ip)) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please slow down.' });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const cohereApiKey = process.env.COHERE_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!geminiApiKey && !cohereApiKey && !openaiApiKey) {
      return res.status(500).json({ error: 'No AI API keys configured (GEMINI_API_KEY, COHERE_API_KEY, or OPENAI_API_KEY)' });
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

    // Try Gemini first if available
    if (geminiApiKey) {
      try {
        const geminiResponse = await callGemini(geminiApiKey, safeMessages, {
          max_tokens,
          temperature,
          top_p,
        });
        
        if (geminiResponse) {
          return res.json(geminiResponse);
        }
      } catch (geminiError) {
        console.warn('Gemini API failed, falling back to Cohere:', geminiError.message);
      }
    }

    // Try Cohere second if available
    if (cohereApiKey) {
      try {
        const cohereResponse = await callCohere(cohereApiKey, safeMessages, {
          max_tokens,
          temperature,
          top_p,
        });
        
        if (cohereResponse) {
          return res.json(cohereResponse);
        }
      } catch (cohereError) {
        console.warn('Cohere API failed, falling back to OpenAI:', cohereError.message);
      }
    }

    // Fallback to OpenAI
    if (openaiApiKey) {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
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
      return res.json(data);
    }

    return res.status(500).json({ error: 'All AI services unavailable' });
  } catch (err) {
    console.error('Chat endpoint error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to call Gemini API
async function callGemini(apiKey, messages, options = {}) {
  const { max_tokens = 300, temperature = 0.8, top_p = 0.9 } = options;
  
  // Convert OpenAI format to Gemini format
  const geminiMessages = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: geminiMessages,
      generationConfig: {
        maxOutputTokens: max_tokens,
        temperature: temperature,
        topP: top_p,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Invalid Gemini response format');
  }

  // Convert Gemini format back to OpenAI format
  const content = data.candidates[0].content.parts[0].text;
  return {
    choices: [{
      message: {
        role: 'assistant',
        content: content
      }
    }],
    usage: data.usageMetadata || {}
  };
}

// Helper function to call Cohere API
async function callCohere(apiKey, messages, options = {}) {
  const { max_tokens = 300, temperature = 0.8, top_p = 0.9 } = options;
  
  // Convert OpenAI format to Cohere format
  const cohereMessages = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'CHATBOT' : 'USER',
    message: msg.content
  }));

  const response = await fetch('https://api.cohere.ai/v1/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: messages[messages.length - 1].content, // Cohere uses the last message
      chat_history: cohereMessages.slice(0, -1), // All messages except the last one
      max_tokens: max_tokens,
      temperature: temperature,
      p: top_p,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cohere API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.text) {
    throw new Error('Invalid Cohere response format');
  }

  // Convert Cohere format back to OpenAI format
  return {
    choices: [{
      message: {
        role: 'assistant',
        content: data.text
      }
    }],
    usage: data.meta || {}
  };
}

const port = process.env.PORT || 8787;
app.listen(port, () => {
});




