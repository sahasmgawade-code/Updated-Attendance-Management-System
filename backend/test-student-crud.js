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

  const addRes = await fetch(`${BASE}/students/batch/1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      urn: 'CS2026-001',
      firstName: 'Rahul',
      lastName: 'Sharma',
      phone: '9876543210',
      email: 'rahul@example.com',
      parentPhone: '9876500000',
    }),
  });
  console.log('Add student:', await addRes.json());

  const listRes = await fetch(`${BASE}/students/batch/1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('List students:', await listRes.json());
}

run();