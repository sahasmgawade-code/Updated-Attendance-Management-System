require('dotenv').config();

const BASE = 'http://localhost:5000/api';

async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return data.token;
}

async function run() {
  // Login as super admin
  const superToken = await login('superadmin@attendqr.com', 'ChangeMe123!');
  console.log('Super admin logged in.');

  // Create a batch as super admin
  const createRes = await fetch(`${BASE}/batches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superToken}`,
    },
    body: JSON.stringify({ name: 'CS Batch 2026' }),
  });
  const created = await createRes.json();
  console.log('Created batch:', created);
  const batchId = created.batch.id;

  // Assign the second admin (id 2) to this batch
  const assignRes = await fetch(`${BASE}/batches/${batchId}/assign-admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superToken}`,
    },
    body: JSON.stringify({ adminId: 2 }),
  });
  console.log('Assign result:', await assignRes.json());

  // List batches as super admin (should see all)
  const superList = await fetch(`${BASE}/batches`, {
    headers: { Authorization: `Bearer ${superToken}` },
  });
  console.log('Super admin batch list:', await superList.json());

  // Login as batch admin and list batches (should see only assigned ones)
  const adminToken = await login('batchadmin1@attendqr.com', 'BatchPass123!');
  const adminList = await fetch(`${BASE}/batches`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('Batch admin batch list:', await adminList.json());
}

run();