const { fetchOrcidWorks } = require('./clients/orcid.js');

module.exports = async function biblioRoutes(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'GET' && url.pathname.startsWith('/api/orcid/')) {
    const id = url.pathname.split('/')[3];
    if (url.pathname.endsWith('/works')) {
      try {
        const works = await fetchOrcidWorks(id);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(works));
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: String(err) }));
      }
      return;
    }
  }
  res.statusCode = 404;
  res.end('Not found');
};
