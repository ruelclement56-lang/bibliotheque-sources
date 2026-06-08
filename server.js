/**
 * Serveur local — Bibliothèque de sources
 * Aucune dépendance npm requise, Node.js suffit.
 *
 * Démarrage : node server.js
 * Puis ouvrir : http://localhost:3000
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

const PORT = 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

const server = http.createServer((req, res) => {
  const parsed   = url.parse(req.url);
  const pathname = parsed.pathname;

  /* CORS — permet les requêtes depuis file:// ou autres origines locales */
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204); res.end(); return;
  }

  /* ── POST /save  ──────────────────────────────────────────── */
  if (req.method === 'POST' && pathname === '/save') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const data     = JSON.parse(body);          // valide le JSON
        const filePath = path.join(ROOT, 'data.json');
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`[${ts()}] data.json mis à jour (${data.length} vidéo(s))`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        console.error(`[${ts()}] Erreur écriture :`, err.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  /* ── GET fichiers statiques ───────────────────────────────── */
  let filePath = path.join(ROOT, pathname === '/' ? '/index.html' : pathname);

  // Sécurité : empêche la traversée de répertoires
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`Fichier introuvable : ${pathname}`);
      } else {
        res.writeHead(500); res.end('Erreur serveur');
      }
      return;
    }

    const ext      = path.extname(filePath).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
});

/* ── Helpers ──────────────────────────────────────────────── */
function ts() {
  return new Date().toLocaleTimeString('fr-FR');
}

/* ── Démarrage ────────────────────────────────────────────── */
server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  ┌─────────────────────────────────────────────┐');
  console.log('  │   Bibliothèque de sources — Serveur local   │');
  console.log('  ├─────────────────────────────────────────────┤');
  console.log(`  │   Page publique  →  http://localhost:${PORT}       │`);
  console.log(`  │   Admin          →  http://localhost:${PORT}/admin │`);
  console.log('  │                                             │');
  console.log('  │   Ctrl+C pour arrêter                       │');
  console.log('  └─────────────────────────────────────────────┘');
  console.log('');
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  ❌ Le port ${PORT} est déjà utilisé.`);
    console.error(`     Changez PORT=${PORT} en haut du fichier, ou arrêtez l'autre processus.\n`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
