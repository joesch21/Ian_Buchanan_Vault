const fs = require('fs');

const data = JSON.parse(fs.readFileSync('data/scholars.json', 'utf8'));
let ok = true;
const re = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
for (const s of data) {
  if (s.orcid && !re.test(s.orcid)) {
    console.error(`Invalid ORCID for ${s.name}: ${s.orcid}`);
    ok = false;
  }
}
if (ok) {
  console.log(`Checked ${data.length} scholars`);
} else {
  process.exit(1);
}
