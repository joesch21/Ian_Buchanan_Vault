import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const QA_DIR = "qa";
if (!existsSync(QA_DIR)) mkdirSync(QA_DIR, { recursive: true });

const items = [];
for (const f of readdirSync(QA_DIR)) {
  if (!f.endsWith(".json")) continue;
  try {
    const j = JSON.parse(readFileSync(join(QA_DIR, f), "utf8"));
    // minimal shape guard
    if (j && j.id && j.question && j.date) items.push(j);
  } catch (e) {
    console.error(`Skip invalid JSON: ${f}`, e.message);
  }
}

items.sort((a, b) => String(b.date).localeCompare(String(a.date)));
writeFileSync("qa-feed.json", JSON.stringify(items, null, 2));
console.log(`Wrote qa-feed.json with ${items.length} entries`);
