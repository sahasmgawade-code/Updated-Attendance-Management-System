require('dotenv').config();
const fs = require('fs');
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

  // Generate a fresh session and submit one response, same as test-qr-flow.js
  const genRes = await fetch(`${BASE}/qr/batch/1/generate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const gen = await genRes.json();
  const sessionToken = gen.session.session_token;

  await fetch(`${BASE}/qr/${sessionToken}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      urn: 'CS2026-001',
      firstName: 'Rahul',
      lastName: 'Sharma',
      deviceToken: 'test-device-download-1',
    }),
  });

  // Download the CSV
  const dlRes = await fetch(`${BASE}/qr/${gen.session.id}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Status:', dlRes.status);
  console.log('Content-Disposition:', dlRes.headers.get('content-disposition'));

  const csvText = await dlRes.text();
  console.log('CSV content:\n' + csvText);

  fs.writeFileSync('downloaded-test.csv', csvText);
  console.log('Saved to downloaded-test.csv — open it to confirm it looks right.');
}

run();