from .ext.orcid import orcid_works
from .ext.openalex import openalex_works_by_author
from .ext.crossref import crossref_search
from .catalog import find_scholar


def dedupe_top(results, limit):
    seen = set()
    out = []
    for r in results:
        key = r.get("doi") or r.get("url") or r.get("title")
        if key in seen:
            continue
        seen.add(key)
        out.append(r)
        if len(out) >= limit:
            break
    return out


def fetch_for(person, concepts, window=None, limit=5):
    results = []
    if person.orcid:
        results += orcid_works(person.orcid, concepts, window)
    if len(results) < limit and person.openalex:
        results += openalex_works_by_author(person.openalex, concepts, window)
    if len(results) < limit:
        results += crossref_search(person.name, concepts, window)
    if len(results) < max(2, limit // 2):
        seed = find_scholar(person.name)
        for title in (seed or {}).get("works_hint", []):
            results.append({"title": title, "year": None, "doi": None, "url": (seed or {}).get("sources", [None])[0]})
    return dedupe_top(results, limit)
