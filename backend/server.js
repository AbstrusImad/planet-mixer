// OPTIONAL LOCAL DEVELOPMENT SERVER.
//
// This server is ONLY for local development to generate more planet art with the
// Gemini API. The published static game does NOT require it: it ships with bundled
// planet images plus a canvas fallback for any fusion that has no image.
//
// Never hardcode an API key. The key is read from backend/.env (see .env.example).

import 'dotenv/config';
import express from 'express';

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 8787;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

function buildPrompt({ name, element, colorA, colorB, rarity, ability }) {
  return [
    `A single ${rarity || 'rare'} fantasy planet named "${name || 'Unknown World'}".`,
    `Dominant element: ${element || 'mixed'}. Signature ability: ${ability || 'unknown'}.`,
    `Color palette blends ${colorA || '#888'} and ${colorB || '#444'}.`,
    'Render it as a perfectly round planet centered on a pure black background,',
    'soft atmospheric glow, crisp rim light, painterly cartoon-space style,',
    'high detail, 512x512, no text, no watermark, no UI.',
  ].join(' ');
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, hasKey: Boolean(GEMINI_API_KEY) });
});

app.post('/api/generate-planet-image', async (req, res) => {
  if (!GEMINI_API_KEY) {
    res.status(500).json({
      error: 'GEMINI_API_KEY is not set. Copy backend/.env.example to backend/.env and add a key.',
    });
    return;
  }

  const prompt = buildPrompt(req.body || {});

  try {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent` +
      `?key=${GEMINI_API_KEY}`;
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE'] },
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      res.status(upstream.status).json({ error: 'Gemini request failed', detail: text });
      return;
    }

    const data = await upstream.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const image = parts.find((p) => p.inlineData || p.inline_data);
    const inline = image?.inlineData || image?.inline_data;

    if (!inline?.data) {
      res.status(502).json({ error: 'No image returned by Gemini', prompt });
      return;
    }

    res.json({
      prompt,
      mimeType: inline.mimeType || inline.mime_type || 'image/png',
      dataUrl: `data:${inline.mimeType || 'image/png'};base64,${inline.data}`,
    });
  } catch (err) {
    res.status(500).json({ error: 'Image generation failed', detail: String(err?.message || err) });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Planet Mixer local image helper listening on http://localhost:${PORT}`);
});
