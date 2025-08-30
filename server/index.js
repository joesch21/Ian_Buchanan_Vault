// ESM-friendly server (node >=18)
import express from "express";
import cors from "cors";
import biblioRoutes from "./biblioRoutes.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/healthz", (_req, res) => res.json({ ok: true }));

app.use("/api", biblioRoutes);

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`[biblio] API listening on http://localhost:${PORT}`);
});
