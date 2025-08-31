import { guide } from "@/content/cartographyGuide";
import { KnowClient } from "@/lib/knowClient";
import React from "react";

function AskKnow({ prompt }: {prompt:string}) {
  const client = new KnowClient();
  return (
    <button className="ask-know" onClick={async ()=>{
      const res = await client.query(prompt);
      const text = "needsTool" in res ? res.draft || "…" : res.answer || "…";
      alert(text); // minimal: page already has the Know widget; this is a quick inline assist
    }}>Ask Know</button>
  );
}

export default function GuideAccordion({ mode = "compact" }:{ mode?: "compact" | "full" }) {
  return (
    <div className="guide-acc">
      <details open>
        <summary>Philosophical</summary>
        <p>{guide.philosophical.trim()}</p>
        {mode==="compact" && <AskKnow prompt="Explain rhizome vs tree in this graph." />}
      </details>

      <details open={mode==="full"}>
        <summary>Practical</summary>
        <div dangerouslySetInnerHTML={{__html: guide.practical.trim().replace(/\n/g,"<br/>")}} />
        {mode==="compact" && <AskKnow prompt="What settings reveal assemblage best here?" />}
      </details>

      <details open={mode==="full"}>
        <summary>Cartography</summary>
        <div dangerouslySetInnerHTML={{__html: guide.cartography.trim().replace(/\n/g,"<br/>")}} />
        {mode==="compact" && <AskKnow prompt="Help me read this cartography: what stands out?" />}
      </details>
    </div>
  );
}
