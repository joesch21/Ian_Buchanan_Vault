📜 Codex Work Order (CWO)

Title: Integrate ORCID Works Feed into Ian Buchanan Vault (with merge)
ID: CWO-IB-ORCID-001
Owner: Ian Buchanan Vault Project
Date: 2025-08-30 (Sydney)

🎯 Objective

Fetch all public works from ORCID 0000-0003-4864-6495, normalize to CSV + Markdown, and merge with the existing Vault bibliography CSV (e.g., Scholar/PhilPapers), with robust deduplication.

🛠️ Deliverables
1. data/ian_buchanan_orcid.csv — ORCID-only dump
2. data/ian_buchanan_orcid.md — Markdown, year-sorted
3. data/ian_buchanan_master.csv — merged + deduped master (if merge source provided)

🧩 Implementation

1) Install deps

pip install requests python-slugify

2) Script: fetch_orcid_buchanan.py

```python
import csv, re, sys, requests
from pathlib import Path
from typing import Dict, List
from slugify import slugify

ORCID_ID = "0000-0003-4864-6495"
BASE = f"https://pub.orcid.org/v3.0/{ORCID_ID}"
HEADERS = {"Accept": "application/json"}

OUT_DIR = Path("data")
OUT_DIR.mkdir(exist_ok=True, parents=True)

CSV_ORCID = OUT_DIR / "ian_buchanan_orcid.csv"
MD_ORCID  = OUT_DIR / "ian_buchanan_orcid.md"
CSV_MASTER = OUT_DIR / "ian_buchanan_master.csv"

# -------- helpers --------
def get(d: Dict, path: List[str], default=""):
    cur = d
    for p in path:
        if isinstance(cur, dict) and p in cur:
            cur = cur[p]
        else:
            return default
    return default if cur is None else cur

def first_ext_id(work: Dict, id_type: str) -> str:
    for e in get(work, ["external-ids", "external-id"], []) or []:
        if e.get("external-id-type", "").lower() == id_type.lower():
            return e.get("external-id-value", "") or ""
    return ""

def normalize_title(t: str) -> str:
    t = (t or "").lower().strip()
    t = re.sub(r"\s+", " ", t)
    t = re.sub(r"[^\w\s]", "", t)
    return t

def row_from_work(w: Dict) -> Dict[str, str]:
    title = get(w, ["title","title","value"])
    subtitle = get(w, ["title","subtitle","value"])
    if subtitle:
        title = f"{title}: {subtitle}"
    year = get(w, ["publication-date","year","value"])
    month = get(w, ["publication-date","month","value"])
    day = get(w, ["publication-date","day","value"])
    date = "-".join([p for p in [year, month, day] if p])

    return {
        "orcid_id": ORCID_ID,
        "title": title or "",
        "type": w.get("type",""),
        "date": date,
        "year": year or "",
        "journal_or_publisher": get(w, ["journal-title","value"]) or w.get("publisher",""),
        "doi": first_ext_id(w, "doi"),
        "isbn": first_ext_id(w, "isbn"),
        "url": first_ext_id(w, "uri") or first_ext_id(w, "url"),
        "citation": get(w, ["citation","citation"]),
        "put_code": str(w.get("put-code","")),
        "source": "ORCID"
    }

def fetch_json(url: str) -> Dict:
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    return r.json()

def fetch_all_orcid_rows() -> List[Dict[str,str]]:
    works = fetch_json(f"{BASE}/works")
    rows: List[Dict[str,str]] = []
    for g in works.get("group", []) or []:
        for s in g.get("work-summary", []) or []:
            put = s.get("put-code")
            if not put:
                continue
            w = fetch_json(f"{BASE}/work/{put}")
            rows.append(row_from_work(w))
    return rows

def dedupe(rows: List[Dict[str,str]]) -> List[Dict[str,str]]:
    seen, out = set(), []
    for r in rows:
        doi = (r.get("doi") or "").lower()
        if doi:
            key = f"doi:{doi}"
        else:
            key = f"titleyear:{normalize_title(r.get('title',''))}|{r.get('year','')}"
        if key not in seen:
            seen.add(key)
            out.append(r)
    return out

def write_csv(rows: List[Dict[str,str]], path: Path):
    if not rows:
        print("No rows to write:", path)
        return
    # union of keys across rows
    fieldnames = []
    for r in rows:
        for k in r.keys():
            if k not in fieldnames:
                fieldnames.append(k)
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    print(f"Wrote CSV → {path}")

def write_md(rows: List[Dict[str,str]], path: Path):
    rows_sorted = sorted(rows, key=lambda r: (r.get("year","9999"), normalize_title(r.get("title",""))))
    lines = ["# Ian Buchanan — ORCID Works (public feed)\n"]
    cur_year = None
    for r in rows_sorted:
        y = r.get("year") or "n.d."
        if y != cur_year:
            lines.append(f"\n## {y}\n")
            cur_year = y
        parts = []
        title = r.get("title",""").strip() or "(untitled)"
        parts.append(f"**{title}**")
        if r.get("journal_or_publisher"): parts.append(r["journal_or_publisher"])
        if r.get("type"): parts.append(f"_{r['type'].replace('_',' ').title()}_")
        if r.get("doi"): parts.append(f"DOI: {r['doi']}")
        if r.get("url"): parts.append(f"[link]({r['url']})")
        lines.append("- " + " — ".join(parts))
    path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote Markdown → {path}")

def load_csv(path: Path) -> List[Dict[str,str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))

def unify_fields(rows: List[Dict[str,str]]) -> List[Dict[str,str]]:
    # ensure consistent headers across heterogenous sources
    canonical = [
        "orcid_id","title","type","date","year","journal_or_publisher",
        "doi","isbn","url","citation","put_code","source"
    ]
    # add any extras that appear
    extras = set()
    for r in rows:
        for k in r.keys():
            if k not in canonical:
                extras.add(k)
    headers = canonical + sorted(extras)
    unified = []
    for r in rows:
        unified.append({k: r.get(k,"") for k in headers})
    return unified

def merge_rows(base_rows: List[Dict[str,str]], add_rows: List[Dict[str,str]]) -> List[Dict[str,str]]:
    combined = unify_fields(base_rows + add_rows)
    return dedupe(combined)

def main():
    # optional arg: path to existing master CSV to merge into
    merge_target = Path(sys.argv[1]) if len(sys.argv) > 1 else None

    print("Fetching ORCID works …")
    orcid_rows = fetch_all_orcid_rows()
    orcid_rows = dedupe(orcid_rows)

    # write ORCID-only outputs
    write_csv(orcid_rows, CSV_ORCID)
    write_md(orcid_rows, MD_ORCID)

    # merge with existing CSV if supplied
    if merge_target:
        print(f"Merging with existing CSV: {merge_target}")
        existing = load_csv(merge_target)
        merged = merge_rows(existing, orcid_rows)
        write_csv(merged, CSV_MASTER)
        print("Merged master written →", CSV_MASTER)

if __name__ == "__main__":
    main()
```

3) Run
• ORCID → CSV/MD:

```
python fetch_orcid_buchanan.py
```

• Merge with your current Vault CSV (e.g., data/ian_buchanan_master.csv):

```
python fetch_orcid_buchanan.py data/ian_buchanan_master.csv
```

This writes:
• data/ian_buchanan_orcid.csv
• data/ian_buchanan_orcid.md
• data/ian_buchanan_master.csv (merged+deduped)

🔐 Notes
• We read from ORCID’s public endpoint (no OAuth required).
• Dedupe priority: DOI, fallback: normalized title + year.
• Re-run quarterly to capture new outputs.

