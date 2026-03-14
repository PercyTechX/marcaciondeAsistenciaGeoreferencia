const http = require('http');

const data = JSON.stringify({
  usuario_id: 1,
  ticket_id: 1,
  tipo: 'INGRESO',
  latitud: -12.046374,
  longitud: -77.042793,
  precision_gps: 10
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/marcacion',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
