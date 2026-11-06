// Integrationstest gegen einen strikten lokalen Pipedrive-Nachbau. Keine echten CRM-Schreibzugriffe.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const writes = [];
let nextId = 100;
let failNotes = false;
let failSearch = false;
const mock = createServer(async (req, res) => {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  const body = raw ? JSON.parse(raw) : {};
  const path = new URL(req.url, 'http://localhost').pathname;
  res.setHeader('content-type', 'application/json');
  if (req.headers['x-api-token'] !== 'integration-test-token') {
    res.writeHead(401).end(JSON.stringify({ success: false }));
    return;
  }
  if (req.method === 'GET') {
    res.writeHead(failSearch ? 503 : 200).end(JSON.stringify({ success: !failSearch, data: { items: [] } }));
    return;
  }
  writes.push({ path, body });
  // Ohne Pipedrive-Kontaktsynchronisierung wird dieses optionale Personenfeld mit 403 abgelehnt.
  if (path === '/api/v2/persons' && Object.hasOwn(body, 'job_title')) {
    res.writeHead(403).end(JSON.stringify({ success: false, error: 'Contact sync is not enabled' }));
    return;
  }
  if (path === '/api/v1/notes') {
    const allowed = ['content', 'deal_id', 'lead_id', 'person_id', 'org_id', 'pinned_to_deal_flag', 'pinned_to_lead_flag'];
    const valid = Object.keys(body).every((key) => allowed.includes(key))
      && typeof body.content === 'string'
      && ((body.deal_id && body.pinned_to_deal_flag === 1) || (body.lead_id && body.pinned_to_lead_flag === 1));
    if (!valid || failNotes) {
      res.writeHead(500).end(JSON.stringify({ success: false, error: 'Note rejected' }));
      return;
    }
  }
  const id = ++nextId;
  res.writeHead(201).end(JSON.stringify({ success: true, data: { id: path === '/api/v1/leads' ? `00000000-0000-4000-8000-${String(id).padStart(12, '0')}` : id } }));
});
mock.listen(0, '127.0.0.1');
await once(mock, 'listening');
const mockUrl = `http://127.0.0.1:${mock.address().port}`;

let app;
let logs = '';
async function start(contactStage) {
  logs = '';
  app = spawn('npm', ['run', 'dev', '--', '--ignore-lock', '--host', '127.0.0.1', '--port', '4398'], {
    detached: true,
    env: { ...process.env, PIPEDRIVE_API_TOKEN: 'integration-test-token', PIPEDRIVE_DOMAIN: 'test', PIPEDRIVE_BASE_URL: mockUrl,
      PIPEDRIVE_PIPELINE_ID: '6', PIPEDRIVE_BOOKING_STAGE_ID: '34', PIPEDRIVE_CONTACT_STAGE_ID: contactStage || '',
      RESEND_API_KEY: '', MAIL_FROM: '', MAIL_NOTIFY_TO: '', FORMS_DEMO: 'false' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  app.stdout.on('data', (chunk) => { logs += chunk; });
  app.stderr.on('data', (chunk) => { logs += chunk; });
  for (let i = 0; i < 200; i++) {
    try { if ((await fetch('http://127.0.0.1:4398/de/')).ok) return; } catch {}
    if (app.exitCode !== null) throw new Error(`Astro stopped: ${logs}`);
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Astro did not start: ${logs}`);
}
async function stop() {
  if (!app || app.exitCode !== null) return;
  process.kill(-app.pid, 'SIGTERM');
  await once(app, 'exit');
}
async function post(route, data, origin = 'http://127.0.0.1:4398') {
  const res = await fetch(`http://127.0.0.1:4398/api/${route}/`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify({ ...data, startedAt: Date.now() - 5000 }),
  });
  return { status: res.status, body: await res.json() };
}
const booking = { locale: 'de', option: 'shared', term: 'prepaid', organisation: 'TEST Integration', name: 'Testperson',
  email: 'test@example.com', role: 'Amtsleitung – Formularprüfung', street: 'Teststraße 1', zip: '12345', city: 'Teststadt', consentPrivacy: true, message: '<script>test</script>' };
const contact = { locale: 'de', name: 'Testperson', email: 'test@example.com', organisation: 'TEST Integration', category: 'demo', message: 'TEST Anfrage', consent: true };
try {
  await start();
  for (const [option, term, value] of [['shared', 'prepaid', 2500], ['shared', 'monthly', 3000], ['dedicated', 'prepaid', 10000], ['dedicated', 'monthly', 12000]]) {
    const result = await post('booking', { ...booking, option, term, value: 1 });
    assert.equal(result.status, 200);
    assert.equal(result.body.ok, true);
    assert.match(result.body.number, /^SSF-\d+$/);
    assert.equal(result.body.emailSent, false);
    assert.equal(writes.findLast((w) => w.path === '/api/v2/deals').body.value, value);
    assert.ok(writes.at(-1).body.content.includes('&lt;script&gt;test&lt;/script&gt;'));
    assert.ok(writes.at(-1).body.content.includes(`<b>Funktion:</b> ${booking.role}`));
    assert.equal(Object.hasOwn(writes.findLast((w) => w.path === '/api/v2/persons').body, 'job_title'), false);
  }
  console.log('PASS: all hosted plans/terms, server prices, CRM notes, HTML escaping, no false mail promise');
  console.log('PASS: new contacts without contact sync; booking role preserved in deal note');

  const { role: _role, ...withoutRole } = booking;
  assert.equal((await post('booking', withoutRole)).status, 200);
  assert.equal(writes.at(-1).body.content.includes('<b>Funktion:</b>'), false);
  console.log('PASS: booking without optional role');

  for (const overrides of [{ consentPrivacy: false }, { zip: 'ABCDE' }, { organisation: '  ' }, { email: 'invalid' }, { option: 'selfhosted' }]) {
    const count = writes.length;
    const result = await post('booking', { ...booking, ...overrides });
    assert.equal(result.status, 400);
    assert.equal(writes.length, count);
  }
  assert.equal((await post('booking', booking, 'https://unrelated.example')).status, 403);
  console.log('PASS: server validation and foreign-origin rejection before CRM writes');

  for (const category of ['demo', 'call', 'selfhosted']) {
    const result = await post('contact', { ...contact, category });
    assert.equal(result.status, 200);
    assert.equal(result.body.ok, true);
    assert.ok(writes.at(-1).body.lead_id);
    assert.equal(writes.at(-1).body.pinned_to_lead_flag, 1);
    if (category === 'selfhosted') assert.match(writes.at(-1).body.content, /169 EUR brutto pro Stunde/);
  }
  console.log('PASS: demo, call and self-hosting enquiries including pinned lead notes and gross support rate');

  failNotes = true;
  for (const [route, input] of [['booking', booking], ['contact', contact]]) {
    const count = writes.length;
    const result = await post(route, input);
    assert.equal(result.status, 502);
    assert.equal(result.body.error, 'partial');
    assert.match(result.body.number, /^SSF-/);
    assert.equal(writes.slice(count).filter((w) => /\/(deals|leads)$/.test(w.path)).length, 1);
  }
  failNotes = false;
  failSearch = true;
  const result = await post('booking', booking);
  assert.equal(result.body.error, 'upstream');
  assert.equal(result.body.number, undefined);
  failSearch = false;
  console.log('PASS: partial CRM writes carry a recovery reference; upstream failures do not claim a booking');

  await stop();
  await start('34');
  assert.equal((await post('contact', contact)).status, 200);
  assert.ok(writes.at(-1).body.deal_id);
  assert.equal(writes.at(-1).body.pinned_to_deal_flag, 1);
  console.log('PASS: optional contact-as-deal configuration');
} finally {
  await stop();
  mock.close();
}
