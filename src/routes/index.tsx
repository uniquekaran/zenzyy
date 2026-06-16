import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Sparkles, ShieldCheck, Clock, Zap, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ParkCard, type Park } from "@/components/park-card";
import { FeaturedPark } from "@/components/featured-park";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useReveal } from "@/hooks/use-reveal";

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
  const trendingRef = useReveal<HTMLDivElement>();
  const ctaRef = useReveal<HTMLDivElement>();
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

  const featured = filtered.find((p) => /v\s*world/i.test(p.name));
  const others = filtered.filter((p) => p !== featured);

  return (
    <div className="min-h-screen flex flex-col animate-fade-in">
      <SiteHeader />
      {/* HERO */}
      <section className="relative overflow-hidden animate-gradient-shift" style={{ background: "linear-gradient(135deg, oklch(0.78 0.14 200) 0%, oklch(0.62 0.18 235) 50%, oklch(0.45 0.18 260) 100%)" }}>
        {/* Floating orbs + bubbles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full opacity-40 blur-3xl animate-float-slow" style={{ background: "radial-gradient(circle, #a5f3fc, transparent 60%)" }} />
          <div className="absolute top-1/2 -right-32 h-96 w-96 rounded-full opacity-30 blur-3xl animate-float-slower" style={{ background: "radial-gradient(circle, #c7d2fe, transparent 60%)" }} />
          <div className="absolute top-24 right-1/4 h-3 w-3 rounded-full bg-white/60 animate-float-slow" />
          <div className="absolute top-1/3 left-1/3 h-2 w-2 rounded-full bg-white/50 animate-float-slower" />
          <div className="absolute bottom-24 right-1/3 h-4 w-4 rounded-full bg-white/40 animate-float-slow" />
        </div>
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 200" preserveAspectRatio="none">
            <path fill="white" fillOpacity="0.15" d="M0,128L60,138.7C120,149,240,171,360,160C480,149,600,107,720,101.3C840,96,960,128,1080,138.7C1200,149,1320,139,1380,133.3L1440,128L1440,200L0,200Z" />
            <path fill="white" fillOpacity="0.25" d="M0,160L80,170.7C160,181,320,203,480,192C640,181,800,139,960,138.7C1120,139,1280,181,1360,202.7L1440,224L1440,200L0,200Z" />
          </svg>
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-32 text-white">
          <div className="max-w-3xl animate-slide-up">
            <span className="inline-flex items-center gap-2 rounded-full glass-panel px-3.5 py-1.5 text-xs font-semibold animate-glow-pulse">
              <Sparkles className="h-3.5 w-3.5" /> Instant tickets · Skip the queues
            </span>
            <h1 className="mt-5 font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05]">
              Skip the Lines.<br />
              <span className="shimmer-text">Dive Right In.</span>
            </h1>
            <p className="mt-5 text-lg text-white/85 max-w-xl">
              Book tickets to India's most exciting water parks in seconds. Pay online, show your QR at the gate, and start splashing.
            </p>

            {/* Search */}
            <div className="mt-8 flex flex-col sm:flex-row gap-2 rounded-2xl bg-white p-2 shadow-2xl max-w-xl transition-transform hover:scale-[1.01] focus-within:ring-4 focus-within:ring-white/30">
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
                className="rounded-xl text-white transition-all hover:scale-[1.05] hover:shadow-lg active:scale-[0.98]"
                style={{ background: "var(--gradient-aqua)" }}
                onClick={() => document.getElementById("trending")?.scrollIntoView({ behavior: "smooth" })}
              >
                <Search className="h-4 w-4 mr-2" /> Search
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/80">
              <span className="flex items-center gap-2 transition hover:text-white"><ShieldCheck className="h-4 w-4" /> Verified parks</span>
              <span className="flex items-center gap-2 transition hover:text-white"><Zap className="h-4 w-4" /> Instant confirmation</span>
              <span className="flex items-center gap-2 transition hover:text-white"><Award className="h-4 w-4" /> Best price guarantee</span>
            </div>
          </div>
        </div>
      </section>

      {/* TRENDING */}
      <section id="trending" className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div ref={trendingRef} className="reveal-on-scroll rounded-3xl bg-background pt-10 pb-2">
          <div className="flex items-end justify-between mb-8 px-2">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold">
                Trending <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">Water Parks</span>
              </h2>
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
            <div className="space-y-12">
              {featured && <FeaturedPark park={featured} />}
              {others.length > 0 && (
                <div ref={ctaRef} className="reveal-on-scroll">
                  <div className="mb-6 px-2">
                    <h3 className="font-display text-2xl sm:text-3xl font-bold">Explore Other Water Parks</h3>
                    <p className="text-muted-foreground mt-1 text-sm">More great escapes near you.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {others.map((p) => (
                      <ParkCard key={p.id} park={p} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
