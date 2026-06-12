import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Sparkles, ShieldCheck, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ParkCard, type Park } from "@/components/park-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zenzyy — Skip the Lines. Dive Right In." },
      { name: "description", content: "Book India's top water park tickets instantly. Aqua Imagica, Wonderla, Della and more." },
      { property: "og:title", content: "Zenzyy — Online Water Park Tickets" },
      { property: "og:description", content: "Skip the queues. Pay online. Show your QR ticket at the gate." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [query, setQuery] = useState("");
  const { data: parks = [], isLoading } = useQuery({
    queryKey: ["parks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parks")
        .select("id,name,location,city,price,rating,image_url")
        .order("rating", { ascending: false });
      if (error) throw error;
      return data as Park[];
    },
  });

  const filtered = query
    ? parks.filter(
        (p) =>
          p.city.toLowerCase().includes(query.toLowerCase()) ||
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.location.toLowerCase().includes(query.toLowerCase()),
      )
    : parks;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 200" preserveAspectRatio="none">
            <path fill="white" fillOpacity="0.15" d="M0,128L60,138.7C120,149,240,171,360,160C480,149,600,107,720,101.3C840,96,960,128,1080,138.7C1200,149,1320,139,1380,133.3L1440,128L1440,200L0,200Z" />
            <path fill="white" fillOpacity="0.25" d="M0,160L80,170.7C160,181,320,203,480,192C640,181,800,139,960,138.7C1120,139,1280,181,1360,202.7L1440,224L1440,200L0,200Z" />
          </svg>
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-32 text-white">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" /> Instant tickets · Skip the queues
            </span>
            <h1 className="mt-5 font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05]">
              Skip the Lines.<br />
              <span className="bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent">Dive Right In.</span>
            </h1>
            <p className="mt-5 text-lg text-white/85 max-w-xl">
              Book tickets to India's most exciting water parks in seconds. Pay online, show your QR at the gate, and start splashing.
            </p>

            {/* Search */}
            <div className="mt-8 flex flex-col sm:flex-row gap-2 rounded-2xl bg-white p-2 shadow-2xl max-w-xl">
              <div className="flex-1 flex items-center gap-2 px-3">
                <MapPin className="h-5 w-5 text-primary" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by city — Pune, Mumbai, Bengaluru..."
                  className="border-0 shadow-none focus-visible:ring-0 text-foreground"
                />
              </div>
              <Button
                size="lg"
                className="rounded-xl text-white"
                style={{ background: "var(--gradient-aqua)" }}
                onClick={() => document.getElementById("trending")?.scrollIntoView({ behavior: "smooth" })}
              >
                <Search className="h-4 w-4 mr-2" /> Search
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/80">
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Verified parks</span>
              <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> Instant confirmation</span>
              <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Best price guarantee</span>
            </div>
          </div>
        </div>
      </section>

      {/* TRENDING */}
      <section id="trending" className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="rounded-3xl bg-background pt-10 pb-2">
          <div className="flex items-end justify-between mb-8 px-2">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold">Trending Water Parks</h2>
              <p className="text-muted-foreground mt-1">Top-rated parks loved by thousands of guests this month.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No parks found for "{query}". Try another city.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((p) => (
                <ParkCard key={p.id} park={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
