import { createWebLetter } from '../lib/web-letter.js';
import { createHash } from 'node:crypto';

const recent = new Map();
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ code: 'method' }); }
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (!origin || (() => { try { return new URL(origin).host !== host; } catch { return true; } })()) return res.status(403).json({ code: 'origin' });
  if (!req.headers['content-type']?.startsWith('application/json')) return res.status(415).json({ code: 'format' });
  let body = req.body;
  try { if (typeof body === 'string') body = JSON.parse(body); } catch { return res.status(400).json({ code: 'invalid' }); }
  if (body?.mode !== undefined && !['reply','direct'].includes(body.mode)) return res.status(400).json({code:'invalid'});
  if (!body || typeof body.text !== 'string' || !body.text.trim() || body.text.length > 3000 || body.consent !== true || !['ru', 'en', 'az'].includes(body.language) || body.website) return res.status(400).json({ code: 'invalid' });
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return res.status(503).json({ code: 'unavailable' });
  const now = Date.now();
  for (const [key, expires] of recent) if (expires <= now) recent.delete(key);
  const ip = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  const key = createHash('sha256').update(ip).digest('hex');
  if (recent.has(key) || recent.size >= 1000) { res.setHeader('Retry-After', '60'); return res.status(429).json({ code: 'rate' }); }
  if (body.mode === 'reply') {
    try {
      const result = await createWebLetter({text:body.text.trim(),language:body.language,token,ip});
      return res.status(result.ok ? 200 : 429).json(result);
    } catch { return res.status(503).json({code:'linkUnavailable'}); }
  }
  recent.set(key, now + 60_000);
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({ chat_id: chatId, text: `Письмо с сайта · ${body.language.toUpperCase()}\nОтвет через сайт недоступен.\n\n${body.text.trim()}`, link_preview_options: { is_disabled: true } })
    });
    const data = await response.json();
    if (!response.ok || !data.ok) return res.status(502).json({ code: 'failed' });
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(504).json({ code: 'uncertain' });
  }
}
