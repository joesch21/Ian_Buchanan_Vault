from flask import Blueprint, request
from svc.prompts import answer_stub, propose_tool
from svc.tools import list_tools

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
