require('dotenv').config();

async function testLogin() {
  const res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'superadmin@attendqr.com',
      password: 'ChangeMe123!', // use whatever you actually set
    }),
  });
  const data = await res.json();
  console.log(data);
}

testLogin();