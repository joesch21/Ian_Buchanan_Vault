import os

try:
    import requests
except Exception:  # pragma: no cover
    requests = None

OPENALEX_BASE = os.getenv("OPENALEX_BASE", "https://api.openalex.org")


def openalex_lookup_author(name: str):
    try:
        if not requests:
            return None
        r = requests.get(f"{OPENALEX_BASE}/authors", params={"search": name}, timeout=5)
        if r.ok:
            data = r.json()
            results = data.get("results", [])
            if results:
                first = results[0]
                return {"id": first.get("id"), "display_name": first.get("display_name")}
    except Exception:
        pass
    return None


def openalex_works_by_author(author_id: str, concepts, window=None):
    try:
        if not requests:
            return []
        r = requests.get(f"{OPENALEX_BASE}/works", params={"filter": f"author.id:{author_id}", "per-page": 5}, timeout=5)
        if r.ok:
            data = r.json()
            out = []
            for w in data.get("results", []):
                out.append({"title": w.get("title"), "year": w.get("publication_year"), "doi": w.get("doi"), "url": w.get("id")})
            return out
    except Exception:
        pass
    return []
