export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60');
  res.status(200).json({ ok: true, msg: 'functions are working' });
}
