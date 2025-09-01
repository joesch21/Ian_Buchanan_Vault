def list_tools(site_id: str):
    return [
        {"name":"openBibliography","description":"Open the Bibliography page with filters",
         "schema":{"type":"object","properties":{"query":{"type":"string"},"type":{"type":"string"},
                   "yearMin":{"type":"integer"},"yearMax":{"type":"integer"}}},"confirm":False},
        {"name":"copyWikiBlock","description":"Copy the current Wikipedia block to clipboard",
         "schema":{"type":"object","properties":{"selection":{"type":"string"}}},"confirm":True}
    ]
