import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  MapPin, Star, Wifi, UtensilsCrossed, Lock, ShowerHead, Car, HeartPulse, Waves,
  CalendarIcon, Minus, Plus, ShieldCheck, ArrowLeft,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/park/$parkId")({
  component: ParkDetail,
});

const facilityIcon: Record<string, any> = {
  "Free WiFi": Wifi, "Food Court": UtensilsCrossed, "Restaurant": UtensilsCrossed,
  "Lockers": Lock, "Locker Rooms": Lock, "Showers": ShowerHead, "Changing Rooms": ShowerHead,
  "Parking": Car, "First Aid": HeartPulse, "Wave Pool": Waves, "Lazy River": Waves,
};
function FIcon({ name }: { name: string }) {
  const I = facilityIcon[name] ?? Waves;
  return <I className="h-4 w-4 text-primary" />;
}

function ParkDetail() {
  const { parkId } = Route.useParams();
  const navigate = useNavigate();
  const [adult, setAdult] = useState(2);
  const [child, setChild] = useState(0);
  const [date, setDate] = useState<Date | undefined>(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d;
  });

  const { data: park, isLoading } = useQuery({
    queryKey: ["park", parkId],
    queryFn: async () => {
      const { data, error } = await supabase.from("parks").select("*").eq("id", parkId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="min-h-screen"><SiteHeader /><div className="mx-auto max-w-7xl px-6 py-20 animate-pulse space-y-6"><div className="h-96 bg-muted rounded-3xl" /><div className="h-8 w-1/3 bg-muted rounded" /></div></div>;
  if (!park) return <div className="min-h-screen"><SiteHeader /><div className="mx-auto max-w-7xl px-6 py-20 text-center"><p>Park not found.</p><Link to="/" className="text-primary">← Back home</Link></div></div>;

  const adultPrice = Number(park.price);
  const childPrice = Math.round(adultPrice * 0.6);
  const total = adult * adultPrice + child * childPrice;
  const gallery: string[] = Array.isArray(park.gallery) ? park.gallery : [park.image_url];
  const facilities: string[] = Array.isArray(park.facilities) ? park.facilities : [];
  const rules: string[] = Array.isArray(park.rules) ? park.rules : [];

  function proceed() {
    if (!date || adult + child === 0) return;
    navigate({
      to: "/checkout",
      search: {
        parkId,
        date: format(date, "yyyy-MM-dd"),
        adult,
        child,
      },
    });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to parks
        </Link>

        {/* Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-3xl overflow-hidden">
          <img src={gallery[0]} alt={park.name} className="md:col-span-2 h-72 md:h-[480px] w-full object-cover" />
          <div className="hidden md:grid gap-3">
            <img src={gallery[1] ?? gallery[0]} alt="" className="h-[234px] w-full object-cover" />
            <img src={gallery[2] ?? gallery[1] ?? gallery[0]} alt="" className="h-[234px] w-full object-cover" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-8">
          {/* LEFT */}
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold">{park.name}</h1>
                <p className="flex items-center gap-1 text-muted-foreground mt-2">
                  <MapPin className="h-4 w-4" /> {park.location}
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-900 px-3 py-1.5 text-sm font-semibold border border-amber-200">
                <Star className="h-4 w-4 fill-amber-400 stroke-amber-400" /> {park.rating} · Excellent
              </div>
            </div>

            <p className="mt-6 text-foreground/80 leading-relaxed">{park.description}</p>

            <h2 className="font-display text-xl font-bold mt-10 mb-4">Facilities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {facilities.map((f) => (
                <div key={f} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-sm">
                  <FIcon name={f} /> {f}
                </div>
              ))}
            </div>

            <h2 className="font-display text-xl font-bold mt-10 mb-4">Park rules</h2>
            <ul className="space-y-2">
              {rules.map((r) => (
                <li key={r} className="flex gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" /> {r}
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT - Booking widget */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">Starting from</span>
                  <p className="font-display text-3xl font-bold text-primary">₹{adultPrice}</p>
                </div>
                <span className="text-xs text-muted-foreground">per adult</span>
              </div>

              <div className="mt-5">
                <label className="text-sm font-medium">Date of visit</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start mt-1.5 font-normal", !date && "text-muted-foreground")}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {date ? format(date, "EEE, MMM d, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Counter label="Adult" sub={`₹${adultPrice} each`} value={adult} onChange={setAdult} min={0} />
              <Counter label="Child" sub={`₹${childPrice} each (4–12 yrs)`} value={child} onChange={setChild} min={0} />

              <div className="mt-5 pt-5 border-t border-border flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-display text-2xl font-bold">₹{total.toLocaleString("en-IN")}</span>
              </div>

              <Button
                onClick={proceed}
                disabled={adult + child === 0 || !date}
                className="w-full mt-4 h-12 rounded-xl text-white font-semibold shadow-[var(--shadow-soft)]"
                style={{ background: "var(--gradient-aqua)" }}
              >
                Proceed to Checkout
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">Free cancellation up to 24h before visit</p>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function Counter({ label, sub, value, onChange, min = 0 }: { label: string; sub: string; value: number; onChange: (n: number) => void; min?: number }) {
  return (
    <div className="mt-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-secondary disabled:opacity-40"
          disabled={value <= min}
        ><Minus className="h-3.5 w-3.5" /></button>
        <span className="w-6 text-center font-semibold">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-secondary"
        ><Plus className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}