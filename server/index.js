const http = require('http');
const biblioRoutes = require('./biblioRoutes.js');

const server = http.createServer((req, res) => {
  if (req.url === '/api/healthz') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  if (req.url.startsWith('/api')) {
    biblioRoutes(req, res); // /api/orcid/:id/works
    return;
  }
  res.statusCode = 404;
  res.end('Not found');
});

const port = process.env.PORT || 8787;
server.listen(port, () => {
  console.log(`proxy listening on ${port}`);
});
