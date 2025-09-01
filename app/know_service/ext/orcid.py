import os

try:
    import requests
except Exception:  # pragma: no cover - fallback when requests unavailable
    requests = None

ORCID_BASE = os.getenv("ORCID_BASE", "https://pub.orcid.org/v3.0")


def orcid_lookup_by_name(name: str) -> str | None:
    try:
        if not requests:
            return None
        url = f"{ORCID_BASE}/search/?q=name:{requests.utils.quote(name)}"
        r = requests.get(url, headers={"Accept": "application/json"}, timeout=5)
        if r.ok:
            data = r.json()
            for res in data.get("result", []):
                oid = res.get("orcid-identifier", {}).get("path")
                if oid:
                    return oid
    except Exception:
        pass
    return None


def orcid_person(orcid: str) -> dict:
    try:
        if not requests:
            return {"name": None}
        url = f"{ORCID_BASE}/{orcid}/person"
        r = requests.get(url, headers={"Accept": "application/json"}, timeout=5)
        if r.ok:
            data = r.json()
            name_parts = data.get("name", {})
            gn = name_parts.get("given-names", {}).get("value")
            fn = name_parts.get("family-name", {}).get("value")
            name = " ".join(p for p in [gn, fn] if p)
            homepage = None
            urls = data.get("researcher-urls", {}).get("researcher-url", [])
            if urls:
                homepage = urls[0].get("url", {}).get("value")
            return {"name": name, "homepage": homepage}
    except Exception:
        pass
    return {"name": None}


def orcid_works(orcid: str, concepts, window=None):
    try:
        if not requests:
            return []
        url = f"{ORCID_BASE}/{orcid}/works"
        r = requests.get(url, headers={"Accept": "application/json"}, timeout=5)
        if r.ok:
            data = r.json()
            out = []
            for g in data.get("group", []):
                w = g.get("work-summary", [{}])[0]
                title = w.get("title", {}).get("title", {}).get("value")
                pub = w.get("publication-date", {})
                year = None
                if pub.get("year"):
                    year = int(pub["year"]["value"])
                doi = None
                for eid in w.get("external-ids", {}).get("external-id", []):
                    if eid.get("external-id-type") == "doi":
                        doi = eid.get("external-id-value")
                        break
                url_work = f"https://doi.org/{doi}" if doi else None
                out.append({"title": title, "year": year, "doi": doi, "url": url_work})
            return out
    except Exception:
        pass
    return []
