from flask import Blueprint, request
from ..know_service.prompts import answer_stub, propose_tool
from ..know_service.tools import list_tools
from ..know_service.people import resolve
from ..know_service.works import fetch_for

bp = Blueprint("know_v1", __name__)

@bp.post("/query")
def query():
    body = request.get_json(force=True)
    site_id = body.get("siteId","buchanan-vault")
    msg = (body.get("msg") or "").strip()
    tool = propose_tool(msg)
    if tool:
        return tool
    return {"answer": answer_stub(site_id, msg), "citations": [{"title":"Bibliography","url":"/bibliography"}]}

@bp.get("/tools")
def tools():
    site_id = request.args.get("siteId") or "buchanan-vault"
    return list_tools(site_id)

@bp.post("/ingest")
def ingest():
    # stub: accept payload so you can wire this later
    body = request.get_json(force=True)
    return {"ok": True, "stats": {"pages": 3, "chunks": 42}}


@bp.post("/cartography/compile")
def compile_cartography():
    body = request.get_json(force=True) or {}
    prompt = body.get("prompt", "")
    mode = body.get("mode", "concept_lineage")

    names = []
    concepts = []
    lower = prompt.lower()
    if "assemblage" in lower:
        concepts.append("assemblage")
    if "across" in lower:
        after = prompt.split("across", 1)[1]
        names = [n.strip(" .") for n in after.replace(" and ", ",").split(",") if n.strip()]
    else:
        names = [prompt]

    persons = resolve(names)
    nodes = []
    edges = []
    refs = {}
    for c in concepts:
        cid = f"concept:{c}"
        code = f"#{c[:3].upper()}"
        nodes.append({"id": cid, "type": "concept", "label": c, "code": code})
        refs[code] = []

    for p in persons:
        aid = p.orcid or p.name
        code = "".join(w[0].upper() for w in p.name.split())
        nodes.append({"id": aid, "type": "author", "label": p.name, "orcid": p.orcid, "code": code})
        works = fetch_for(p, concepts)
        for w in works:
            wid = w.get("doi") or w.get("url") or w["title"]
            nodes.append({"id": wid, "type": "work", "label": w["title"], "year": w.get("year"), "url": w.get("url")})
            edges.append({"source": aid, "target": wid, "kind": "authored"})
            for c in concepts:
                if c.lower() in (w.get("title", "").lower()):
                    edges.append({"source": f"concept:{c}", "target": wid, "kind": "concept"})
                    code = f"#{c[:3].upper()}"
                    refs[code].append({"title": w["title"], "url": w.get("url"), "doi": w.get("doi"), "year": w.get("year")})

    return {"nodes": nodes, "edges": edges, "refs": refs}
