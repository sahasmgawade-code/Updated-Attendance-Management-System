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
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // 1. Get attendance for yesterday — student has no record yet, should default to 'absent'
  const beforeRes = await fetch(`${BASE}/attendance/batch/1?date=${yesterday}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Before save:', await beforeRes.json());

  // 2. Manually mark student 1 as present for yesterday
  const saveRes = await fetch(`${BASE}/attendance/batch/1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      date: yesterday,
      records: [{ studentId: 1, status: 'present' }],
    }),
  });
  console.log('Save result:', await saveRes.json());

  // 3. Get attendance again — should now show present, method 'manual'
  const afterRes = await fetch(`${BASE}/attendance/batch/1?date=${yesterday}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('After save:', await afterRes.json());
}

run();