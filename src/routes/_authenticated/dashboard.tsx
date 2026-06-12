import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin, Ticket, LogOut, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["my-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, parks(name, location, image_url)")
        .order("visit_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const active = bookings.filter((b: any) => new Date(b.visit_date) >= today);
  const past = bookings.filter((b: any) => new Date(b.visit_date) < today);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-10 flex-1">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">My Dashboard</h1>
            <p className="text-muted-foreground mt-1">{user?.email}</p>
          </div>
          <Button variant="outline" onClick={signOut}><LogOut className="h-4 w-4 mr-2" /> Sign out</Button>
        </div>

        <Tabs defaultValue="active" className="mt-8">
          <TabsList>
            <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="mt-6">
            <BookingList items={active} loading={isLoading} emptyHint="No upcoming bookings. Time for a splash?" />
          </TabsContent>
          <TabsContent value="past" className="mt-6">
            <BookingList items={past} loading={isLoading} emptyHint="No past bookings yet." />
          </TabsContent>
        </Tabs>
      </main>
      <SiteFooter />
    </div>
  );
}

function BookingList({ items, loading, emptyHint }: { items: any[]; loading: boolean; emptyHint: string }) {
  if (loading) return <div className="grid gap-4">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}</div>;
  if (items.length === 0) return (
    <div className="text-center py-16 rounded-2xl border border-dashed border-border">
      <Ticket className="h-10 w-10 mx-auto text-muted-foreground" />
      <p className="mt-3 text-muted-foreground">{emptyHint}</p>
      <Link to="/" className="inline-flex items-center gap-1 mt-4 text-primary font-medium">Browse parks <ArrowRight className="h-4 w-4" /></Link>
    </div>
  );
  return (
    <div className="grid gap-4">
      {items.map((b) => (
        <Link
          key={b.id}
          to="/success/$bookingId"
          params={{ bookingId: b.id }}
          className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border border-border bg-card hover:shadow-[var(--shadow-card)] transition"
        >
          <img src={b.parks?.image_url} alt="" className="h-28 sm:w-44 w-full object-cover rounded-xl" />
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display font-semibold text-lg">{b.parks?.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3.5 w-3.5" /> {b.parks?.location}</p>
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded bg-secondary text-secondary-foreground">{b.booking_code}</span>
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground"><CalendarDays className="h-4 w-4" /> {format(new Date(b.visit_date), "MMM d, yyyy")}</span>
              <span className="text-muted-foreground">{b.adult_count} Adult{b.child_count > 0 && `, ${b.child_count} Child`}</span>
              <span className="font-semibold text-primary ml-auto">₹{Number(b.total_amount).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}