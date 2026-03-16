const axios = require('axios');

async function test() {
  try {
    const email = 'testuser' + Math.floor(Math.random()*1000) + '@test.com';
    const regRes = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Test',
      email: email,
      password: 'password123'
    });
    const token = regRes.data.token;
    
    // Create an interview
    await axios.post('http://localhost:5000/api/user/interviews', {
       jobRole: 'Developer',
       jobDescription: 'Stuff',
       questions: [],
       answers: [],
       overallScore: 90,
       overallFeedback: 'Good'
    }, { headers: { Authorization: 'Bearer ' + token } }).catch(e=>console.log('int error ignored')); // wait, I don't know the route for interviews, it might not exist there.

    const statRes = await axios.get('http://localhost:5000/api/user/dashboard-stats', {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log('Stats:', JSON.stringify(statRes.data, null, 2));
  } catch(e) {
    console.error('Error:', e.response ? e.response.data : e.message);
  }
}
test();
