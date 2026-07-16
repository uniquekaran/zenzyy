import { useState } from "react";
import { Waves, Droplet, Zap, Baby, UtensilsCrossed, CloudRain, Ruler, Weight, ShieldCheck, Clock } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type Zone = {
  id: string;
  name: string;
  zone_type: string;
  height_min_cm: number | null;
  weight_max_kg: number | null;
  safety_notes: string | null;
  avg_wait_minutes: number;
  x_pct: number;
  y_pct: number;
  icon: string | null;
};

const iconMap: Record<string, any> = {
  waves: Waves,
  droplet: Droplet,
  zap: Zap,
  baby: Baby,
  utensils: UtensilsCrossed,
  "cloud-rain": CloudRain,
};

const typeColor: Record<string, string> = {
  wave: "from-cyan-400 to-blue-500",
  lazy: "from-teal-400 to-cyan-500",
  extreme: "from-red-400 to-orange-500",
  kids: "from-pink-400 to-fuchsia-500",
  food: "from-amber-400 to-orange-500",
};

function jitter(base: number) {
  // small deterministic-looking wait jitter for realism
  return Math.max(0, base + Math.round((Math.sin(Date.now() / 60000 + base) * 4)));
}

export function ParkMap({ zones }: { zones: Zone[] }) {
  const [active, setActive] = useState<Zone | null>(null);

  if (zones.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <Waves className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl font-bold">Explore the Park — Interactive Map</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Tap any zone for restrictions, safety guidelines and live wait times.</p>

      <div className="relative aspect-[16/9] rounded-3xl overflow-hidden border border-border shadow-[var(--shadow-card)]"
           style={{ background: "radial-gradient(ellipse at 30% 30%, #67e8f9 0%, #38bdf8 40%, #0369a1 100%)" }}>
        {/* wavy overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none" viewBox="0 0 400 225">
          <path fill="white" d="M0,150 Q100,120 200,150 T400,150 L400,225 L0,225 Z" />
          <path fill="white" fillOpacity="0.4" d="M0,180 Q100,160 200,180 T400,180 L400,225 L0,225 Z" />
        </svg>
        {/* Zone pins */}
        {zones.map((z) => {
          const Icon = iconMap[z.icon ?? ""] ?? Waves;
          const grad = typeColor[z.zone_type] ?? "from-cyan-400 to-blue-500";
          return (
            <button
              key={z.id}
              onClick={() => setActive(z)}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${z.x_pct}%`, top: `${z.y_pct}%` }}
              aria-label={z.name}
            >
              <span className={cn(
                "absolute inset-0 rounded-full blur-md opacity-70 animate-pulse bg-white",
              )} />
              <span className={cn(
                "relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-lg ring-4 ring-white/40 transition-transform group-hover:scale-110",
                grad,
              )}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white opacity-0 group-hover:opacity-100 transition">
                {z.name} · {jitter(z.avg_wait_minutes)}m
              </span>
            </button>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-3 left-3 rounded-xl bg-white/85 backdrop-blur px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow">
          Tap any glowing pin to see details
        </div>
      </div>

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 font-display text-2xl">
                  {active.name}
                </SheetTitle>
                <SheetDescription>Zone type: {active.zone_type}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div className="rounded-xl border border-border p-4 bg-secondary/40">
                  <p className="flex items-center gap-2 text-primary font-semibold">
                    <Clock className="h-4 w-4" /> Live estimated wait: {jitter(active.avg_wait_minutes)} min
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border p-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Ruler className="h-3 w-3" /> Min height</p>
                    <p className="font-semibold">{active.height_min_cm ? `${active.height_min_cm} cm` : "No limit"}</p>
                  </div>
                  <div className="rounded-xl border border-border p-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Weight className="h-3 w-3" /> Max weight</p>
                    <p className="font-semibold">{active.weight_max_kg ? `${active.weight_max_kg} kg` : "No limit"}</p>
                  </div>
                </div>
                {active.safety_notes && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900 flex gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{active.safety_notes}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}