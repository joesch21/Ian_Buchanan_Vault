import csv, re, sys, requests
from pathlib import Path

ORCID = sys.argv[1] if len(sys.argv) > 1 else "0000-0003-4864-6495"
BASE = f"https://pub.orcid.org/v3.0/{ORCID}"
HEADERS = {"Accept":"application/json"}

OUT_SITE = Path("site/public/data"); OUT_SITE.mkdir(parents=True, exist_ok=True)
OUT_DATA = Path("data"); OUT_DATA.mkdir(exist_ok=True)

CSV_ORCID = OUT_SITE / f"{ORCID}.csv"
MD_ORCID  = OUT_SITE / f"{ORCID}.md"
CSV_LATEST = OUT_SITE / "author_latest.csv"
MD_LATEST  = OUT_SITE / "author_latest.md"
CSV_MASTER = OUT_DATA / "master.csv"

def get(d, p, default=""):
    for k in p:
        d = d.get(k) if isinstance(d, dict) else {}
    return d or default

def first_id(w, t):
    for e in (get(w,["external-ids","external-id"],[]) or []):
        if e.get("external-id-type","" ).lower()==t.lower():
            return e.get("external-id-value","") or ""
    return ""

def norm_title(t):
    t = (t or "").lower().strip()
    t = re.sub(r"\s+"," ",t)
    return re.sub(r"[^\w\s]","",t)

def fetch_json(url): return requests.get(url, headers=HEADERS, timeout=30).json()

def rows_from_orcid():
    works = fetch_json(f"{BASE}/works")
    rows = []
    for g in works.get("group",[]) or []:
        for s in g.get("work-summary",[]) or []:
            put = s.get("put-code")
            if not put: continue
            w = fetch_json(f"{BASE}/work/{put}")
            title = get(w,["title","title","value"])
            sub   = get(w,["title","subtitle","value"])
            if sub: title = f"{title}: {sub}"
            year  = get(w,["publication-date","year","value"])
            rows.append({
                "orcid_id": ORCID,
                "title": title,
                "type": w.get("type",""),
                "year": year or "",
                "journal_or_publisher": get(w,["journal-title","value"]) or w.get("publisher",""),
                "doi": first_id(w,"doi"),
                "isbn": first_id(w,"isbn"),
                "url": first_id(w,"uri") or first_id(w,"url"),
                "source": "ORCID"
            })
    # dedupe (DOI else title+year)
    out, seen = [], set()
    for r in rows:
        key = ("doi:"+r["doi"].lower()) if r["doi"] else "ty:"+norm_title(r["title"])+"|"+r["year"]
        if key in seen: continue
        seen.add(key); out.append(r)
    return out

def write_csv(rows, p):
    if not rows: return
    keys = list({k for r in rows for k in r.keys()})
    with p.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=keys); w.writeheader(); w.writerows(rows)

def write_md(rows, p):
    rows = sorted(rows, key=lambda r:(r.get("year","9999"), norm_title(r.get("title",""))))
    lines = [f"# ORCID {ORCID} — Works\n"]
    cur = None
    for r in rows:
        y = r.get("year") or "n.d."
        if y!=cur: lines.append(f"\n## {y}\n"); cur=y
        parts=[f"**{r.get('title','(untitled)')}**"]
        if r.get("journal_or_publisher"): parts.append(r["journal_or_publisher"])
        if r.get("type"): parts.append(f"_{r['type']}_")
        if r.get("doi"): parts.append(f"DOI: {r['doi']}")
        if r.get("url"): parts.append(f"[link]({r['url']})")
        lines.append("- " + " — ".join(parts))
    p.write_text("\n".join(lines), encoding="utf-8")

def append_master(rows):
    # load existing
    master = []
    if CSV_MASTER.exists():
        with CSV_MASTER.open("r",encoding="utf-8",newline="") as f:
            master = list(csv.DictReader(f))
    allrows = master + rows
    # re-dedupe
    seen, out = set(), []
    for r in allrows:
        key = ("doi:"+r.get("doi","" ).lower()) if r.get("doi") else "ty:"+norm_title(r.get("title",""))+"|"+r.get("year","" )
        if key in seen: continue
        seen.add(key); out.append(r)
    write_csv(out, CSV_MASTER)

def main():
    rows = rows_from_orcid()
    write_csv(rows, CSV_ORCID); write_md(rows, MD_ORCID)
    # update "latest" alias for the UI
    write_csv(rows, CSV_LATEST); write_md(rows, MD_LATEST)
    append_master(rows)

if __name__ == "__main__": main()
