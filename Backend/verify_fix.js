import http from 'http';

const check = (path) => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: path,
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`[VERIFY] PATH: ${path} | STATUS: ${res.statusCode} | CSP: ${res.headers['content-security-policy'] || 'NOT SET'}`);
    res.on('data', () => {});
  });

  req.on('error', (e) => {
    console.error(`[ERROR] ${path}: ${e.message}`);
  });

  req.end();
};

check('/');
check('/.well-known/appspecific/com.chrome.devtools.json');
