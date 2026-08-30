const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

let latestPhoto = null;
const sseClients = new Set();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.obj': 'text/plain',
};

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // 1. API: Get Local Network IPs for QR Code & Pairing
  if (pathname === '/api/ip') {
    const ips = getLocalIpAddresses();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ips,
      port: PORT,
      cameraUrl: ips.length > 0 ? `http://${ips[0]}:${PORT}/camera.html` : `http://localhost:${PORT}/camera.html`,
      scannerUrl: `http://localhost:${PORT}/3d-scanner.html`
    }));
    return;
  }

  // 2. API: Server-Sent Events (SSE) for Real-Time Photo Sync
  if (pathname === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.write('data: {"type":"connected"}\n\n');
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // 3. API: Upload Photo from Mobile Camera
  if (pathname === '/api/upload' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // Safety limit: 25MB
      if (body.length > 25 * 1024 * 1024) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload too large' }));
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (!data.image) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No image provided' }));
          return;
        }

        latestPhoto = {
          image: data.image,
          timestamp: Date.now(),
          metadata: data.metadata || {}
        };

        // Broadcast to all connected desktop viewers
        const payload = JSON.stringify({
          type: 'new_photo',
          timestamp: latestPhoto.timestamp,
          image: latestPhoto.image,
          metadata: latestPhoto.metadata
        });

        for (const client of sseClients) {
          client.write(`data: ${payload}\n\n`);
        }

        console.log(`[Photo Sync] Received photo from ${req.socket.remoteAddress}, broadcasted to ${sseClients.size} desktop viewer(s).`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, timestamp: latestPhoto.timestamp }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // 4. API: Get Latest Photo
  if (pathname === '/api/latest-photo') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(latestPhoto || { message: 'No photo uploaded yet' }));
    return;
  }

  // 5. Static File Serving
  let filePath = path.join(ROOT_DIR, pathname === '/' ? 'index.html' : pathname);

  // Security check: stay within ROOT_DIR
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    res.end('Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIpAddresses();
  console.log('====================================================');
  console.log(`Blueprint & 3D Ray Tracer Server running on port ${PORT}`);
  console.log(`- Desktop App:    http://localhost:${PORT}/index.html`);
  console.log(`- 3D Scanner:     http://localhost:${PORT}/3d-scanner.html`);
  console.log(`- 3D Ray Tracer:  http://localhost:${PORT}/raytracer.html`);
  console.log('Phone Camera Connection URLs:');
  ips.forEach(ip => {
    console.log(`  http://${ip}:${PORT}/camera.html`);
  });
  console.log('====================================================');
});
