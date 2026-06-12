import { Link } from "@tanstack/react-router";
import { MapPin, Star } from "lucide-react";

export interface Park {
  id: string;
  name: string;
  location: string;
  city: string;
  price: number;
  rating: number;
  image_url: string;
}

export function ParkCard({ park }: { park: Park }) {
  return (
    <Link
      to="/park/$parkId"
      params={{ parkId: park.id }}
      className="group block overflow-hidden rounded-2xl bg-card border border-border/60 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={park.image_url}
          alt={park.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 text-xs font-semibold shadow">
          <Star className="h-3 w-3 fill-amber-400 stroke-amber-400" />
          {park.rating}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display font-semibold text-lg line-clamp-1">{park.name}</h3>
        <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
          <MapPin className="h-3.5 w-3.5" /> {park.location}
        </p>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <span className="text-xs text-muted-foreground">Starting from</span>
            <p className="font-display text-xl font-bold text-primary">₹{park.price}</p>
          </div>
          <span className="text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
            Book →
          </span>
        </div>
      </div>
    </Link>
  );
}