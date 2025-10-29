import fetch from 'node-fetch';

async function testRegistration() {
  const registrationData = {
    email: `test${Date.now()}@example.com`,
    password: 'testpassword123',
    name: 'Test User',
    role: 'student'
  };

  console.log('Testing registration with:', registrationData);

  try {
    const response = await fetch('http://localhost:5000/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData),
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', result);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRegistration();