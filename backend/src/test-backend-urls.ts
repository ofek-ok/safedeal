async function testUrls() {
  const candidateUrls = [
    'https://safedeal.onrender.com',
    'https://safedeal-backend.onrender.com',
    'https://safedeal-api.onrender.com',
    'https://safedeal-server.onrender.com',
  ];

  for (const baseUrl of candidateUrls) {
    try {
      console.log(`Testing ${baseUrl}/api/v1/properties/status/test ...`);
      const res = await fetch(`${baseUrl}/api/v1/properties/status/test`);
      console.log(` -> Status: ${res.status} ${res.statusText}`);
    } catch (err: any) {
      console.log(` -> Error: ${err.message}`);
    }
  }
}

testUrls();
