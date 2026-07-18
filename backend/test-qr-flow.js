require('dotenv').config();
const BASE = 'http://localhost:5000/api';

async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return (await res.json()).token;
}

async function run() {
  const token = await login('batchadmin1@attendqr.com', 'BatchPass123!');

  // 1. Generate QR session for batch 1
  const genRes = await fetch(`${BASE}/qr/batch/1/generate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const gen = await genRes.json();
  console.log('Generated session:', gen.session, '\nScan URL:', gen.scanUrl);
  const sessionToken = gen.session.session_token;

  // 2. Simulate student submitting via scan URL
  const submitRes = await fetch(`${BASE}/qr/${sessionToken}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      urn: 'CS2026-001',
      firstName: 'Rahul',
      lastName: 'Sharma',
      deviceToken: 'test-device-123',
    }),
  });
  console.log('Submit result:', await submitRes.json());

  // 3. Try submitting again with same device (should fail)
  const dupeRes = await fetch(`${BASE}/qr/${sessionToken}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      urn: 'CS2026-001',
      firstName: 'Rahul',
      lastName: 'Sharma',
      deviceToken: 'test-device-123',
    }),
  });
  console.log('Duplicate attempt (expect 409):', await dupeRes.json());

  // 4. Get the report for this session
  const reportRes = await fetch(`${BASE}/qr/${gen.session.id}/report`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Session report:', await reportRes.json());
}

run();