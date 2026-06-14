import { Link } from "@tanstack/react-router";
import { Award, Clock, MapPin, Star, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Park } from "@/components/park-card";

export function FeaturedPark({ park }: { park: Park }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-card border border-border/60 shadow-[var(--shadow-card)]">
      <div className="grid lg:grid-cols-2 gap-0">
        {/* Image */}
        <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[460px] overflow-hidden">
          <img
            src={park.image_url}
            alt={park.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
            <Award className="h-3.5 w-3.5" />
            Chitrakoot's No. 1 Choice
          </div>
          <div className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur px-3 py-1.5 text-xs font-semibold shadow">
            <Star className="h-3.5 w-3.5 fill-amber-400 stroke-amber-400" />
            {park.rating} · 1,842 verified reviews
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            ★ Best Seller
          </span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-extrabold leading-tight">
            {park.name}
          </h2>
          <p className="mt-2 text-muted-foreground">
            Experience the ultimate thrill and water adventures in Chitrakoot Dham, Karwi.
          </p>

          {/* Rating row */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 stroke-amber-400" />
              ))}
            </div>
            <span className="font-semibold text-sm">{park.rating}</span>
            <span className="text-sm text-muted-foreground">(1,842 ratings)</span>
          </div>

          {/* Highlights */}
          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <li className="flex items-center gap-2.5 rounded-xl bg-muted/50 px-3 py-2.5 text-sm">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span><span className="font-medium">Timing:</span> 10 AM – 6 PM</span>
            </li>
            <li className="flex items-center gap-2.5 rounded-xl bg-muted/50 px-3 py-2.5 text-sm">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span><span className="font-medium">Karwi,</span> Chitrakoot</span>
            </li>
            <li className="flex items-center gap-2.5 rounded-xl bg-muted/50 px-3 py-2.5 text-sm sm:col-span-2">
              <Waves className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium">Massive Wave Pool & Jungle Safari Dining</span>
            </li>
          </ul>

          {/* CTA */}
          <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs text-muted-foreground">Starting from</span>
              <p className="font-display text-3xl font-extrabold text-primary">₹{park.price}</p>
            </div>
            <Button
              asChild
              size="lg"
              className="rounded-xl text-white shadow-lg hover:shadow-xl transition-shadow"
              style={{ background: "var(--gradient-aqua)" }}
            >
              <Link to="/park/$parkId" params={{ parkId: park.id }}>
                Select Tickets →
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}