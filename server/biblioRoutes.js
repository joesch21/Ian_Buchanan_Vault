import { Router } from "express";
import { fetchOrcidWorks } from "./clients/orcid.js";

const r = Router();

r.get("/orcid/:id/works", async (req, res) => {
  try {
    const data = await fetchOrcidWorks(req.params.id);
    res.json(data);
  } catch (e) {
    console.error("ORCID route error:", e);
    res.status(500).json({ error: "orcid_fetch_failed" });
  }
});

export default r;
