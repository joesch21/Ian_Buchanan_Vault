import { KnowClient, QueryResponse } from "@/lib/knowClient";
import { runTool } from "@/lib/knowTools";

type Opts = { siteId?: string; welcome?: string };

export class KnowWidget {
  private root!: HTMLElement; private panel!: HTMLElement; private log!: HTMLElement;
  private input!: HTMLInputElement; private sendBtn!: HTMLButtonElement;
  private client: KnowClient;

  constructor(container: HTMLElement, opts: Opts = {}) {
    this.client = new KnowClient(undefined, opts.siteId);
    this.mount(container, opts.welcome ?? "Ask about bibliography, formatting, or Wikipedia blocks.");
  }

  private mount(container: HTMLElement, welcome: string) {
    this.root = document.createElement("div");
    this.root.className = "kb-root";
    this.root.innerHTML = `
      <button class="kb-fab" aria-label="Open Know chat">?</button>
      <div class="kb-panel" hidden>
        <div class="kb-head"><strong>Know</strong><button class="kb-close" aria-label="Close">×</button></div>
        <div class="kb-log" role="log" aria-live="polite"></div>
        <form class="kb-form">
          <input class="kb-input" placeholder="Ask a question…" autocomplete="off" />
          <button class="kb-send" type="submit">Send</button>
        </form>
      </div>`;
    container.appendChild(this.root);
    this.panel = this.root.querySelector(".kb-panel")!;
    this.log = this.root.querySelector(".kb-log")!;
    this.input = this.root.querySelector(".kb-input")!;
    this.sendBtn = this.root.querySelector(".kb-send")!;

    const fab = this.root.querySelector(".kb-fab")!; const close = this.root.querySelector(".kb-close")!;
    fab.addEventListener("click", () => (this.panel.hidden = false));
    close.addEventListener("click", () => (this.panel.hidden = true));

    (this.root.querySelector(".kb-form") as HTMLFormElement).onsubmit = (e) => {
      e.preventDefault(); const msg = this.input.value.trim(); if (msg) this.ask(msg); this.input.value = "";
    };

    this.appendBot(welcome);
  }

  private appendUser(t: string){ this.addMsg(t,"kb-user"); }
  private appendBot(t: string){ this.addMsg(t,"kb-bot"); }
  private appendNote(t: string){ this.addMsg(t,"kb-note"); }
  private addMsg(t: string, cls: string){
    const el=document.createElement("div"); el.className="kb-msg "+cls; el.textContent=t;
    this.log.appendChild(el); this.log.scrollTop=this.log.scrollHeight;
  }

  async ask(msg: string) {
    this.appendUser(msg); this.sendBtn.disabled = true;
    try {
      const res: QueryResponse = await this.client.query(msg);
      if ("needsTool" in res && res.needsTool) {
        if (res.draft) this.appendBot(res.draft);
        const execute = async()=>{const out=await runTool(res.call);this.appendNote(out.message||"");};
        if (res.confirm && !window.confirm(res.draft||"Proceed?")) this.appendNote("Cancelled."); else await execute();
        if (res.answer) this.appendBot(res.answer);
      } else {
        this.appendBot(res.answer);
        if (res.citations?.length) this.appendNote("Sources: "+res.citations.map(c=>c.title).join(", "));
      }
    } catch(e:any){ this.appendNote(`Error: ${e?.message||String(e)}`); }
    finally{ this.sendBtn.disabled = false; }
  }
}
