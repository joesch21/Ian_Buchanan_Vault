def answer_stub(site_id: str, msg: str) -> str:
    m = (msg or "").lower()
    if "assemblage" in m:
        return ("Assemblage theory (per Deleuze & Guattari) treats phenomena as contingent wholes "
                "composed of heterogeneous parts whose relations are productive and revisable—not essences. "
                "Buchanan’s scholarship clarifies method: describe components, relations, capacities, "
                "and territorialization/deterritorialization dynamics.")
    if "wikipedia" in m and "block" in m:
        return "Use the Wikipedia block generator on the right rail of the Bibliography page, then copy."
    if "formatting" in m or "referenc" in m:
        return "Open the Formatting page for APA, Chicago, Harvard examples and BibTeX/RIS export."
    return "Ask about Buchanan’s works, assemblage, schizoanalysis, or say 'open bibliography for <topic> 2000–2010'."

def propose_tool(msg: str):
    m = (msg or "").lower()
    # open bibliography intent
    if m.startswith("open bibliography") or "open the bibliography" in m:
        # crude parse: extract query and years
        import re
        q = None; ymin=None; ymax=None; typ=None
        qm = re.search(r"for ([a-z0-9\- ]+)", m)
        if qm: q = qm.group(1).strip()
        ym = re.findall(r"(19|20)\d{2}", m)
        if ym:
            ymin = int(ym[0]); ymax = int(ym[-1]) if len(ym)>1 else None
        tm = re.search(r"type (book|article|chapter|edited volume|thesis|other)", m)
        if tm: typ = tm.group(1)
        return {"needsTool": True, "call": {"name":"openBibliography",
                 "args": {"query": q, "type": typ, "yearMin": ymin, "yearMax": ymax}},
                "answer":"Opening Bibliography with your filters…",
                "citations":[{"title":"Bibliography","url":"/bibliography"}]}
    # copy wiki
    if "copy wikipedia block" in m or "copy wiki block" in m:
        sample = "* ''Assemblage Theory and Method''. Bloomsbury. 2021. ISBN 9781350014680."
        return {"needsTool": True, "call": {"name":"copyWikiBlock", "args":{"selection": sample}},
                "confirm": True, "draft": "Copy the current Wikipedia block?", "answer":"Copied to clipboard."}
    return None
