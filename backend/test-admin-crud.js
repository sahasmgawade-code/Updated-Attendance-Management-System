require('dotenv').config();

const BASE = 'http://localhost:5000/api';

async function run() {
  // 1. Login as super admin
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'superadmin@attendqr.com',
      password: 'ChangeMe123!',
    }),
  });
  const { token } = await loginRes.json();
  console.log('Logged in, token acquired.');

  // 2. Create a new admin
  const createRes = await fetch(`${BASE}/admins`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Batch Admin One',
      email: 'batchadmin1@attendqr.com',
      password: 'BatchPass123!',
    }),
  });
  const created = await createRes.json();
  console.log('Created admin:', created);

  // 3. List all admins
  const listRes = await fetch(`${BASE}/admins`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const list = await listRes.json();
  console.log('All admins:', list);
}

run();