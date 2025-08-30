import csv, re, sys, json, requests
from pathlib import Path
from collections import defaultdict, Counter

HEADERS = {"Accept":"application/json"}

ROOT_SITE = Path("site/public/data")
ROOT_SITE.mkdir(parents=True, exist_ok=True)
COMPARE_DIR = ROOT_SITE / "compare"
COMPARE_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

MASTER = DATA_DIR / "master.csv"
MATRIX_CSV = COMPARE_DIR / "matrix.csv"
SUMMARY_JSON = COMPARE_DIR / "summary.json"

def norm_title(t:str)->str:
    import re
    t = (t or "").lower().strip()
    t = re.sub(r"\s+"," ",t)
    return re.sub(r"[^\w\s]","",t)

def get(d, path, default=""):
    cur = d
    for p in path:
        cur = cur.get(p) if isinstance(cur, dict) else {}
    return cur or default

def first_id(w, t):
    for e in (get(w,["external-ids","external-id"],[]) or []):
        if e.get("external-id-type","" ).lower()==t.lower():
            return e.get("external-id-value","" ) or ""
    return ""

def fetch_orcid(orcid:str):
    base = f"https://pub.orcid.org/v3.0/{orcid}"
    works = requests.get(f"{base}/works", headers=HEADERS, timeout=30).json()
    rows = []
    for g in works.get("group",[]) or []:
        for s in g.get("work-summary",[]) or []:
            put = s.get("put-code")
            if not put: continue
            w = requests.get(f"{base}/work/{put}", headers=HEADERS, timeout=30).json()
            title = get(w,["title","title","value"])
            sub   = get(w,["title","subtitle","value"])
            if sub: title = f"{title}: {sub}"
            year  = get(w,["publication-date","year","value"])
            rows.append({
                "orcid_id": orcid,
                "title": title or "",
                "type": w.get("type",""),
                "year": year or "",
                "journal_or_publisher": get(w,["journal-title","value"]) or w.get("publisher",""),
                "doi": first_id(w,"doi"),
                "isbn": first_id(w,"isbn"),
                "url": first_id(w,"uri") or first_id(w,"url"),
                "source": "ORCID"
            })
    # dedupe per author
    seen, out = set(), []
    for r in rows:
        key = ("doi:"+r["doi"].lower()) if r["doi"] else "ty:"+norm_title(r["title"]) +"|"+ r["year"]
        if key in seen: continue
        seen.add(key); out.append(r)
    return out

def write_csv(rows, path):
    if not rows: return
    fields = list({k for r in rows for k in r.keys()})
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader(); w.writerows(rows)

def write_md(rows, path, orcid):
    rows = sorted(rows, key=lambda r:(r.get("year","9999"), norm_title(r.get("title",""))))
    lines = [f"# ORCID {orcid} — Works\n"]
    cur = None
    for r in rows:
        y = r.get("year") or "n.d."
        if y!=cur: lines.append(f"\n## {y}\n"); cur=y
        parts=[f"**{r['title'] or '(untitled)'}**"]
        if r.get("journal_or_publisher"): parts.append(r["journal_or_publisher"])
        if r.get("type"): parts.append(f"_{r['type']}_")
        if r.get("doi"): parts.append(f"DOI: {r['doi']}")
        if r.get("url"): parts.append(f"[link]({r['url']})")
        lines.append("- " + " — ".join(parts))
    path.write_text("\n".join(lines), encoding="utf-8")

def load_csv(path):
    if not path.exists(): return []
    with path.open("r", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))

def dedupe_all(rows):
    seen, out = set(), []
    for r in rows:
        key = ("doi:"+ (r.get("doi","" ).lower())) if r.get("doi") else "ty:"+norm_title(r.get("title","")) +"|"+ r.get("year","")
        if key in seen: continue
        seen.add(key); out.append(r)
    return out

def build_matrix(all_rows):
    # Aggregate by author -> year/type counts
    by_author = defaultdict(lambda: {"total":0, "by_year":Counter(), "by_type":Counter()})
    for r in all_rows:
        a = r["orcid_id"]; y = r.get("year","n.d."); t = r.get("type","")
        by_author[a]["total"] += 1
        by_author[a]["by_year"][y] += 1
        by_author[a]["by_type"][t] += 1

    # Select top year buckets for compact matrix
    years = sorted({y for a in by_author for y in by_author[a]["by_year"] if y and y != "n.d."})
    years = years[-10:]  # last 10 years available

    # CSV matrix: rows=author, cols=total + per-year counts
    header = ["orcid_id","total"] + years
    rows = []
    for a, agg in by_author.items():
        row = {"orcid_id": a, "total": agg["total"]}
        for y in years:
            row[y] = agg["by_year"].get(y, 0)
        rows.append(row)

    # write matrix.csv
    with MATRIX_CSV.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=header)
        w.writeheader(); w.writerows(rows)

    # write summary.json (for UI)
    summary = {
        "years": years,
        "authors": [{
            "orcid_id": a,
            "total": by_author[a]["total"],
            "by_year": dict(by_author[a]["by_year"]),
            "by_type": dict(by_author[a]["by_type"])
        } for a in by_author]
    }
    SUMMARY_JSON.write_text(json.dumps(summary, indent=2), encoding="utf-8")

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/compare_orcids.py ORCID1,ORCID2,...")
        sys.exit(1)

    orcids = [o.strip() for o in sys.argv[1].split(",") if o.strip()]
    all_rows = load_csv(MASTER)

    for orcid in orcids:
        rows = fetch_orcid(orcid)
        # write per-author dumps into site/public/data
        write_csv(rows, ROOT_SITE / f"{orcid}.csv")
        write_md(rows, ROOT_SITE / f"{orcid}.md", orcid)
        # merge into master
        all_rows.extend(rows)

    all_rows = dedupe_all(all_rows)
    write_csv(all_rows, MASTER)
    build_matrix(all_rows)

if __name__ == "__main__":
    main()
