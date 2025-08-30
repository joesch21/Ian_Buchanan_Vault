const http = require('http');
const biblioRoutes = require('./biblioRoutes.js');

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api')) {
    biblioRoutes(req, res);
    return;
  }
  res.statusCode = 404;
  res.end('Not found');
});

const port = process.env.PORT || 8787;
server.listen(port, () => {
  console.log(`proxy listening on ${port}`);
});
