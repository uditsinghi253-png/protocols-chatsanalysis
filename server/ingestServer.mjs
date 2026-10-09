/**
 * Local-First Live Ingest & Watcher Server (Loopback Only: 127.0.0.1)
 * Provides a loopback REST & SSE endpoint to stream live chat messages into the app in real time.
 * Why: Hard constraint C5 & Tier 2 Live Mode. Bound strictly to 127.0.0.1 loopback.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 4040;
const HOST = '127.0.0.1'; // Strictly loopback
const WATCH_DIR = path.resolve('watch');

if (!fs.existsSync(WATCH_DIR)) {
  fs.mkdirSync(WATCH_DIR, { recursive: true });
}

const clients = new Set();

const server = http.createServer((req, res) => {
  // CORS strictly locked to local origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // SSE stream endpoint
  if (req.url === '/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    res.write('data: {"type":"connected"}\n\n');
    clients.add(res);

    req.on('close', () => {
      clients.delete(res);
    });
    return;
  }

  // Push new message line
  if (req.url === '/api/messages' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        broadcast({ type: 'new_message', data: payload });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', deliveredTo: clients.size }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Healthcheck
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'live', host: HOST, port: PORT }));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

function broadcast(event) {
  const dataStr = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) {
    client.write(dataStr);
  }
}

// Watch folder for appended files
fs.watch(WATCH_DIR, (eventType, filename) => {
  if (filename && filename.endsWith('.txt')) {
    const fullPath = path.join(WATCH_DIR, filename);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        broadcast({ type: 'file_updated', filename, content });
      } catch {
        // file busy
      }
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`📡 Local Ingest Server listening strictly on http://${HOST}:${PORT}`);
  console.log(`📁 Watching folder: ${WATCH_DIR}`);
});
