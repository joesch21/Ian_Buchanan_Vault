const { fetchOrcidWorks } = require('./clients/orcid.js');

module.exports = async function biblioRoutes(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET') {
    const match = url.pathname.match(/^\/api\/orcid\/([^/]+)\/works$/);
    if (match) {
      try {
        const works = await fetchOrcidWorks(match[1]);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ works }));
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: String(err) }));
      }
      return;
    }
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Not found' }));
};
