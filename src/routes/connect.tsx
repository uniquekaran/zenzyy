import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Copy, Bot, Sparkles, ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/connect")({
  head: () => ({
    meta: [
      { title: "Connect an AI assistant — Zenzyy" },
      { name: "description", content: "Connect ChatGPT or Claude to Zenzyy so your AI assistant can browse water parks for you." },
    ],
  }),
  component: ConnectPage,
});

function ConnectPage() {
  const [mcpUrl, setMcpUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMcpUrl(new URL("/mcp", window.location.origin).toString());
  }, []);

  async function copy() {
    if (!mcpUrl) return;
    await navigator.clipboard.writeText(mcpUrl);
    setCopied(true);
    toast.success("URL copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl w-full px-4 sm:px-6 lg:px-8 py-10 flex-1">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white mb-4" style={{ background: "var(--gradient-aqua)" }}>
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">Connect an AI assistant</h1>
          <p className="mt-3 text-muted-foreground">
            Let ChatGPT or Claude browse Zenzyy water parks for you. Copy the URL below, then follow the steps for your assistant.
          </p>
        </div>

        {/* URL card */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Zenzyy MCP URL</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded-xl bg-secondary/70 px-4 py-3 font-mono text-sm">
              {mcpUrl || "Loading…"}
            </code>
            <Button onClick={copy} disabled={!mcpUrl} className="h-11 rounded-xl">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="ml-2">{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>
        </div>

        {/* ChatGPT */}
        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold">Connect ChatGPT</h2>
          </div>
          <ol className="space-y-3 text-sm text-foreground/90 list-decimal pl-5">
            <li>
              Open{" "}
              <a className="text-primary underline" target="_blank" rel="noreferrer" href="https://chatgpt.com/#settings/Connectors/Advanced">
                ChatGPT → Settings → Connectors → Advanced
              </a>{" "}
              and enable <strong>Developer mode</strong> (read the risk notice shown there).
            </li>
            <li>In the chat composer, open the <strong>+</strong> menu and turn on <strong>Developer mode</strong>.</li>
            <li>Click <strong>Add sources</strong>, then <strong>Connect more</strong>.</li>
            <li>Give the connector a name (e.g. "Zenzyy") and paste the MCP URL above.</li>
            <li>Ask ChatGPT to find you a water park.</li>
          </ol>
        </section>

        {/* Claude */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold">Connect Claude</h2>
          </div>
          <ol className="space-y-3 text-sm text-foreground/90 list-decimal pl-5">
            <li>
              Open{" "}
              <a className="text-primary underline" target="_blank" rel="noreferrer" href="https://claude.ai/customize/connectors?modal=add-custom-connector">
                Claude → Custom Connectors
              </a>.
            </li>
            <li>Give the connector a name (e.g. "Zenzyy") and paste the MCP URL above.</li>
            <li>Enable the connector from the chat composer, then ask Claude to browse Zenzyy parks.</li>
          </ol>
        </section>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Your assistant will be able to search Zenzyy's water parks and fetch park details.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}