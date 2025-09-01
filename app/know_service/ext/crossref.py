import os

try:
    import requests
except Exception:  # pragma: no cover
    requests = None

CROSSREF_BASE = os.getenv("CROSSREF_BASE", "https://api.crossref.org")


def crossref_search(name: str, concepts, window=None):
    try:
        if not requests:
            return []
        query = name
        if concepts:
            query += " " + " ".join(concepts)
        r = requests.get(f"{CROSSREF_BASE}/works", params={"query": query, "rows": 5}, timeout=5)
        if r.ok:
            data = r.json()
            out = []
            for item in data.get("message", {}).get("items", []):
                title = item.get("title", [""])[0]
                year = None
                parts = item.get("issued", {}).get("date-parts", [[None]])[0]
                if parts:
                    year = parts[0]
                doi = item.get("DOI")
                url = item.get("URL")
                out.append({"title": title, "year": year, "doi": doi, "url": url})
            return out
    except Exception:
        pass
    return []
