from dataclasses import dataclass
from .catalog import find_scholar
from .ext.orcid import orcid_lookup_by_name, orcid_person
from .ext.openalex import openalex_lookup_author


@dataclass
class Person:
    name: str
    orcid: str | None
    aliases: list[str]
    homepage: str | None
    openalex: str | None
    sources: list[str]
    confidence: float
    source: str


def resolve(names: list[str]) -> list[Person]:
    out = []
    for n in names:
        seed = find_scholar(n)
        if seed:
            out.append(Person(
                name=seed["name"],
                orcid=seed.get("orcid"),
                aliases=seed.get("aliases", []),
                homepage=None,
                openalex=None,
                sources=seed.get("sources", []),
                confidence=0.95,
                source="seed"
            ))
            continue
        oc = orcid_lookup_by_name(n)
        if oc:
            pr = orcid_person(oc)
            out.append(Person(pr.get("name", n), oc, [], pr.get("homepage"), None, [], 0.9, "orcid"))
            continue
        oa = openalex_lookup_author(n)
        if oa:
            out.append(Person(oa.get("display_name", n), None, [], None, oa["id"], [oa.get("id")], 0.8, "openalex"))
            continue
        out.append(Person(n, None, [], None, None, [], 0.5, "string"))
    return out
