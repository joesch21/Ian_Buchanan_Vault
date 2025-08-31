import { describe, it, expect, vi } from "vitest";
import { compileCartography } from "@/lib/cartography";

vi.mock("@/lib/biblio", () => ({
  fetchWorksByOrcids: vi.fn(async () => (await import("./fixtures/works.mock.json")).default)
}));

vi.mock("@/lib/names", () => ({
  resolveName: vi.fn(async (orcid: string) =>
    orcid === "0000-0002-1825-0097" ? "Ian Buchanan" :
    orcid === "0000-0002-4384-3615" ? "Brian Massumi" : orcid)
}));

vi.mock("@/lib/crossref", () => ({
  enrichWithCrossref: vi.fn(async (w: any) => w)
}));

describe("compileCartography()", () => {
  it("compiles seed example into nodes/edges/refs", async () => {
    const spec = (await import("./fixtures/spec.seed.json")).default;
    const expected = (await import("./fixtures/graph.expected.json")).default;
    const out = await compileCartography(spec);
    expect(out).toEqual(expected);
  });
});
