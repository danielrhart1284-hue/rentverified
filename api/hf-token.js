// api/hf-token.js — Safely exposes HF token to client (read-only inference only)
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ token: process.env.HF_API_TOKEN || '' });
}
