import { KnowClient, QueryResponse } from "@/lib/knowClient";
import { runTool } from "@/lib/knowTools";

type Opts = { siteId?: string; welcome?: string };

const KB_STATE_KEY = "kb_isOpen";

export class KnowWidget {
  private root!: HTMLElement;
  private panel!: HTMLElement;
  private log!: HTMLElement;
  private input!: HTMLInputElement;
  private sendBtn!: HTMLButtonElement;
  private fab!: HTMLButtonElement;
  private btnClose!: HTMLButtonElement;
  private btnMin!: HTMLButtonElement;
  private client: KnowClient;
  private isOpen = false;
  private openScrollY = 0;
  private touchYStart: number | null = null;

  constructor(container: HTMLElement, opts: Opts = {}) {
    this.client = new KnowClient(undefined, opts.siteId);
    this.mount(container, opts.welcome ?? "Hi! Ask about bibliography, formatting, or wiki blocks.");
    // Restore last state (per tab)
    const saved = sessionStorage.getItem(KB_STATE_KEY);
    if (saved === "true") this.openPanel("restore");
  }

  private mount(container: HTMLElement, welcome: string) {
    this.root = document.createElement("div");
    this.root.className = "kb-root";
    this.root.innerHTML = `
      <button class="kb-fab" aria-label="Open Know chat">?</button>
      <div class="kb-panel" hidden>
        <div class="kb-head">
          <strong>Know</strong>
          <div class="kb-head-actions">
            <button class="kb-min" title="Minimize" aria-label="Minimize">–</button>
            <button class="kb-close" title="Close" aria-label="Close">×</button>
          </div>
        </div>
        <div class="kb-log" role="log" aria-live="polite"></div>
        <form class="kb-form">
          <input class="kb-input" placeholder="Ask a question…" autocomplete="off" />
          <button class="kb-send" type="submit">Send</button>
        </form>
      </div>`;
    container.appendChild(this.root);

    this.panel = this.root.querySelector(".kb-panel") as HTMLElement;
    this.log = this.root.querySelector(".kb-log") as HTMLElement;
    this.input = this.root.querySelector(".kb-input") as HTMLInputElement;
    this.sendBtn = this.root.querySelector(".kb-send") as HTMLButtonElement;
    this.fab = this.root.querySelector(".kb-fab") as HTMLButtonElement;
    this.btnClose = this.root.querySelector(".kb-close") as HTMLButtonElement;
    this.btnMin = this.root.querySelector(".kb-min") as HTMLButtonElement;

    // Open / close controls
    this.fab.addEventListener("click", () => this.openPanel("fab"));
    this.btnClose.addEventListener("click", () => this.closePanel("close-btn"));
    this.btnMin.addEventListener("click", () => this.closePanel("min-btn"));

    // Submit handler
    (this.root.querySelector(".kb-form") as HTMLFormElement).onsubmit = (e) => {
      e.preventDefault();
      const msg = this.input.value.trim();
      if (msg) this.ask(msg);
      this.input.value = "";
    };

    // Tap/click outside to dismiss
    document.addEventListener("pointerdown", (ev) => {
      if (!this.isOpen) return;
      const t = ev.target as Node;
      if (!this.panel.contains(t) && !this.fab.contains(t)) this.closePanel("outside");
    });

    // ESC to close
    window.addEventListener("keydown", (e) => {
      if (this.isOpen && e.key === "Escape") this.closePanel("esc");
    });

    // Auto-collapse on scroll (user started reading)
    window.addEventListener("scroll", () => {
      if (!this.isOpen) return;
      const moved = Math.abs(window.scrollY - this.openScrollY);
      if (moved > 80) this.closePanel("scroll");
    }, { passive: true });

    // Route changes (SPA navigation)
    window.addEventListener("hashchange", () => this.closePanel("hashchange"));
    window.addEventListener("popstate", () => this.closePanel("popstate"));

    // Mobile swipe-down to dismiss
    this.panel.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) this.touchYStart = e.touches[0].clientY;
    }, { passive: true });
    this.panel.addEventListener("touchmove", (e) => {
      if (this.touchYStart == null) return;
      const dy = e.touches[0].clientY - this.touchYStart;
      if (dy > 70) {
        this.touchYStart = null;
        this.closePanel("swipe");
      }
    }, { passive: true });
    this.panel.addEventListener("touchend", () => { this.touchYStart = null; });

    // Welcome message
    this.appendBot(welcome);
  }

  private openPanel(reason: string) {
    if (this.isOpen) return;
    this.panel.hidden = false;
    this.isOpen = true;
    this.openScrollY = window.scrollY;
    sessionStorage.setItem(KB_STATE_KEY, "true");
    this.fab?.setAttribute("aria-expanded", String(this.isOpen));
    // focus input without jumping viewport on mobile
    setTimeout(() => this.input?.focus({ preventScroll: true }), 0);
  }

  private closePanel(reason: string) {
    if (!this.isOpen) return;
    this.panel.hidden = true;
    this.isOpen = false;
    sessionStorage.setItem(KB_STATE_KEY, "false");
    this.fab?.setAttribute("aria-expanded", String(this.isOpen));
  }

  private appendUser(t: string) { this.addMsg(t, "kb-user"); }
  private appendBot(t: string) { this.addMsg(t, "kb-bot"); }
  private appendNote(t: string) { this.addMsg(t, "kb-note"); }
  private addMsg(t: string, cls: string) {
    const el = document.createElement("div");
    el.className = "kb-msg " + cls;
    el.textContent = t;
    this.log.appendChild(el);
    this.log.scrollTop = this.log.scrollHeight;
  }

  async ask(msg: string) {
    if (!this.isOpen) this.openPanel("auto");
    this.appendUser(msg);
    this.sendBtn.disabled = true;
    try {
      const res: QueryResponse = await this.client.query(msg);
      if ("needsTool" in res && res.needsTool) {
        if (res.draft) this.appendBot(res.draft);
        const exec = async () => {
          const out = await runTool(res.call);
          this.appendNote(out.message || (out.ok ? "Done." : "Failed."));
        };
        if (res.confirm) {
          const ok = window.confirm(res.draft || "Proceed?");
          if (ok) await exec();
          else this.appendNote("Cancelled.");
        } else {
          await exec();
        }
        if (res.answer) this.appendBot(res.answer);
      } else {
        this.appendBot(res.answer);
        if (res.citations?.length) this.appendNote("Sources: " + res.citations.map(c => c.title).join(", "));
      }
    } catch (e: any) {
      this.appendNote(`Error: ${e?.message || String(e)}`);
    } finally {
      this.sendBtn.disabled = false;
    }
  }
}
