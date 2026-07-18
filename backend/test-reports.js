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

  const batchReportRes = await fetch(`${BASE}/reports/batch/1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Batch report:', JSON.stringify(await batchReportRes.json(), null, 2));

  const studentReportRes = await fetch(`${BASE}/reports/student/1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Student report:', JSON.stringify(await studentReportRes.json(), null, 2));
}

run();