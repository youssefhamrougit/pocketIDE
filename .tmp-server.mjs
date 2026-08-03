import http from 'http';
import fs from 'fs';
import path from 'path';

const root = process.argv[2] || '.';
const port = parseInt(process.argv[3] || '8899', 10);
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.apk': 'application/vnd.android.package-archive', '.md': 'text/plain' };

http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const resolved = path.resolve(root);
  const file = path.resolve(root, '.' + p);
  if (file !== resolved && !file.startsWith(resolved + path.sep)) { res.writeHead(403); res.end('forbidden'); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, () => console.log(`serving ${root} on ${port}`));
