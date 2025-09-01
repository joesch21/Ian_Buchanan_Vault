import json
import os
import functools

CATALOG_PATH = os.getenv("SCHOLAR_CATALOG_PATH", "data/scholars.json")


@functools.lru_cache(maxsize=1)
def load_scholar_catalog():
    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def find_scholar(name: str):
    cat = load_scholar_catalog()
    q = name.lower().strip()
    for s in cat:
        if s["name"].lower() == q or any(q == a.lower() for a in s.get("aliases", [])):
            return s
    for s in cat:
        if q in s["name"].lower():
            return s
    return None
