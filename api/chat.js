// RentVerified – Vercel serverless: chat via Anthropic Claude API
// Set ANTHROPIC_API_KEY in Vercel env. Request: { message, propertyContext?, listingId? }. Response: { reply }.

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

function allowCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  allowCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: 'Chat not configured', reply: '' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch (_) {
    return res.status(400).json({ error: 'Invalid JSON', reply: '' });
  }
  const message = (body.message || '').trim();
  if (!message) return res.status(400).json({ error: 'Missing message', reply: '' });

  const propertyContext = body.propertyContext || 'General RentVerified / Sanders Property Management inquiry.';
  const system = `You are the friendly AI assistant for Sanders Property Management on RentVerified. Answer briefly and helpfully about rentals, applications, tours, and this property. Do not make up rent or addresses; use only the context below. If you don't know, suggest they request an application or contact management.

Property context: ${propertyContext}

Keep replies to 1–3 short paragraphs. Be professional and welcoming.`;

  const payload = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system,
    messages: [{ role: 'user', content: message }]
  };

  try {
    const r = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data.error?.message || 'Claude API error', reply: '' });
    }
    const text = data.content && data.content[0] && data.content[0].text;
    return res.status(200).json({ reply: text || '' });
  } catch (e) {
    return res.status(502).json({ error: e.message || 'Upstream error', reply: '' });
  }
}
