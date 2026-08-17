/**
 * POST /api/enquiry
 * Serverless function (Vercel Node runtime) that receives the "Check your date" form.
 *
 * By default it validates + logs the enquiry (visible in Vercel → your project → Logs).
 * Set ENQUIRY_WEBHOOK_URL in the project's Environment Variables to also push each
 * enquiry to Slack / Discord / Google Chat / Make.com — no code change needed.
 */

// best-effort throttle. Serverless instances are recycled, so this only slows
// down a burst from one IP hitting the same warm instance — good enough for a demo.
const hits = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip) || { count: 0, start: now };
  if (now - rec.start > WINDOW_MS) { rec.count = 0; rec.start = now; }
  rec.count += 1;
  hits.set(ip, rec);
  if (hits.size > 500) hits.clear();
  return rec.count > MAX_PER_WINDOW;
}

const clean = (v, max = 1000) => String(v == null ? '' : v).trim().slice(0, max);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || typeof body !== 'object') body = {};

  // honeypot: bots fill hidden fields. Pretend everything went fine.
  if (clean(body.website)) return res.status(200).json({ ok: true });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ ok: false, error: 'Too many enquiries just now — please call us instead.' });
  }

  const name    = clean(body.name, 120);
  const phone   = clean(body.phone, 40);
  const pkg     = clean(body.package, 40);
  const message = clean(body.message, 2000);

  if (name.length < 2) {
    return res.status(400).json({ ok: false, error: 'Please enter your name.' });
  }
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    return res.status(400).json({ ok: false, error: 'Please enter a phone number we can call back on.' });
  }

  const enquiry = {
    name, phone, package: pkg || 'Not specified', message,
    receivedAt: new Date().toISOString(),
    ip, userAgent: clean(req.headers['user-agent'], 200)
  };

  // Always logged — Vercel → Project → Logs, or `vercel logs <deployment>`
  console.log('[enquiry]', JSON.stringify(enquiry));

  const hook = process.env.ENQUIRY_WEBHOOK_URL;
  if (hook) {
    try {
      await fetch(hook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text:
            `*New enquiry — Shree Vaibhav Mahal*\n` +
            `Name: ${name}\nPhone: ${phone}\nPackage: ${enquiry.package}\n` +
            `Message: ${message || '—'}`,
          enquiry
        })
      });
    } catch (err) {
      // never fail the visitor's submission because a webhook is down
      console.error('[enquiry] webhook failed:', err && err.message);
    }
  }

  return res.status(200).json({ ok: true, message: 'Enquiry received' });
};
