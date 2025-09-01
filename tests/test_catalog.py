import os
import sys
import pytest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
os.environ.setdefault("SCHOLAR_CATALOG_PATH", "data/scholars.json")

from app.know_service.catalog import load_scholar_catalog
from app.know_service.people import resolve
from app.know_service.works import fetch_for
from app import app as flask_app


def test_seed_loaded():
    cat = load_scholar_catalog()
    assert any(s["name"] == "Manuel DeLanda" for s in cat)


def test_delanda_without_orcid_has_works():
    p = resolve(["Manuel DeLanda"])[0]
    ws = fetch_for(p, ["assemblage"])
    assert len(ws) >= 1


def test_compile_flex_many():
    client = flask_app.test_client()
    r = client.post("/api/know/v1/cartography/compile", json={
        "siteId": "buchanan-vault",
        "prompt": "compare assemblage across Massumi, Protevi, DeLanda, Buchanan",
        "mode": "concept_lineage"
    })
    assert r.status_code == 200
    data = r.get_json()
    assert any(n["type"] == "author" and "DeLanda" in n["label"] for n in data["nodes"])
    assert any(n["type"] == "concept" and n["label"] == "assemblage" and n["code"] == "#ASS" for n in data["nodes"])
