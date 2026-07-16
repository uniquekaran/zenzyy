import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarDays, MapPin, Ticket, LogOut, ArrowRight, CalendarCheck, XCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { useServerFn } from "@tanstack/react-start";
import { rescheduleBookingFn, cancelBookingFn } from "@/lib/booking.functions";
import { getMyWallet } from "@/lib/wallet.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const reschedule = useServerFn(rescheduleBookingFn);
  const cancel = useServerFn(cancelBookingFn);
  const walletFn = useServerFn(getMyWallet);

  const { data: wallet } = useQuery({
    queryKey: ["my-wallet", user?.id],
    enabled: !!user,
    queryFn: () => walletFn(),
  });

  const [reschedTarget, setReschedTarget] = useState<any | null>(null);
  const [reschedDate, setReschedDate] = useState<Date | undefined>();
  const [cancelTarget, setCancelTarget] = useState<any | null>(null);

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
  const active = bookings.filter((b: any) => b.status !== "cancelled" && new Date(b.visit_date) >= today);
  const past = bookings.filter((b: any) => b.status !== "cancelled" && new Date(b.visit_date) < today);
  const cancelled = bookings.filter((b: any) => b.status === "cancelled");

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  const reschedMutation = useMutation({
    mutationFn: async () => {
      if (!reschedTarget || !reschedDate) throw new Error("Pick a date");
      return reschedule({
        data: { id: reschedTarget.id, newDate: format(reschedDate, "yyyy-MM-dd") },
      });
    },
    onSuccess: () => {
      toast.success("Visit date updated");
      setReschedTarget(null);
      setReschedDate(undefined);
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (e: any) => toast.error(e.message || "Reschedule failed"),
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!cancelTarget) throw new Error("Missing booking");
      return cancel({ data: { id: cancelTarget.id } });
    },
    onSuccess: () => {
      toast.success("Booking cancelled");
      setCancelTarget(null);
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (e: any) => toast.error(e.message || "Cancel failed"),
  });

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

        {wallet && (
          <div className="mt-6 rounded-2xl p-5 text-white shadow-[var(--shadow-card)]" style={{ background: "var(--gradient-aqua)" }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest opacity-80">Zenzyy Cash Wallet</p>
                <p className="font-display text-3xl font-bold mt-1">₹{wallet.balance.toLocaleString("en-IN")}</p>
                <p className="text-xs opacity-80 mt-1">Refer a friend — you both get ₹100 on their first booking.</p>
              </div>
              <div className="rounded-xl bg-white/15 backdrop-blur px-4 py-3 text-center">
                <p className="text-[10px] uppercase opacity-80">Your referral code</p>
                <button
                  onClick={() => { navigator.clipboard.writeText(wallet.referralCode); toast.success("Referral code copied!"); }}
                  className="font-mono font-bold text-xl tracking-wider hover:opacity-80"
                >{wallet.referralCode}</button>
              </div>
            </div>
            {wallet.transactions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/20 text-sm">
                <p className="text-xs uppercase opacity-80 mb-2">Recent activity</p>
                <div className="space-y-1">
                  {wallet.transactions.slice(0, 3).map((t: any) => (
                    <div key={t.id} className="flex justify-between text-xs">
                      <span className="opacity-90">{t.reason}</span>
                      <span className={t.type === "credit" ? "font-semibold" : "opacity-80"}>{t.type === "credit" ? "+" : ""}₹{Math.abs(Number(t.amount)).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <Tabs defaultValue="active" className="mt-8">
          <TabsList>
            <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="mt-6">
            <BookingList
              items={active} loading={isLoading}
              emptyHint="No upcoming bookings. Time for a splash?"
              onReschedule={(b) => { setReschedTarget(b); setReschedDate(new Date(b.visit_date)); }}
              onCancel={(b) => setCancelTarget(b)}
            />
          </TabsContent>
          <TabsContent value="past" className="mt-6">
            <BookingList items={past} loading={isLoading} emptyHint="No past bookings yet." />
          </TabsContent>
          <TabsContent value="cancelled" className="mt-6">
            <BookingList items={cancelled} loading={isLoading} emptyHint="No cancelled bookings." />
          </TabsContent>
        </Tabs>
      </main>
      <SiteFooter />

      {/* Reschedule modal */}
      <Dialog open={!!reschedTarget} onOpenChange={(o) => !o && setReschedTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule your visit</DialogTitle>
            <DialogDescription>
              You can shift your visit date up to 24 hours before your current booking.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={reschedDate}
              onSelect={setReschedDate}
              disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
              className="rounded-md border pointer-events-auto"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReschedTarget(null)}>Not now</Button>
            <Button
              onClick={() => reschedMutation.mutate()}
              disabled={reschedMutation.isPending || !reschedDate}
              style={{ background: "var(--gradient-aqua)" }}
              className="text-white"
            >
              {reschedMutation.isPending ? "Updating…" : "Confirm new date"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel modal */}
      <Dialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this booking?</DialogTitle>
            <DialogDescription>Please review our refund policy before confirming.</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-secondary/50 p-4 text-sm space-y-2">
            <div className="flex gap-2"><ShieldCheck className="h-4 w-4 text-primary mt-0.5" /><span><b>7+ days before visit:</b> Full refund.</span></div>
            <div className="flex gap-2"><ShieldCheck className="h-4 w-4 text-primary mt-0.5" /><span><b>2–7 days:</b> 50% refund.</span></div>
            <div className="flex gap-2"><ShieldCheck className="h-4 w-4 text-muted-foreground mt-0.5" /><span><b>Within 48 hours:</b> Non-refundable.</span></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Keep booking</Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling…" : "Cancel booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BookingList({
  items, loading, emptyHint, onReschedule, onCancel,
}: {
  items: any[]; loading: boolean; emptyHint: string;
  onReschedule?: (b: any) => void;
  onCancel?: (b: any) => void;
}) {
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
        <div key={b.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border border-border bg-card hover:shadow-[var(--shadow-card)] transition">
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
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                b.status === "cancelled" ? "bg-red-100 text-red-700" :
                b.status === "pending_verification" ? "bg-amber-100 text-amber-800" :
                "bg-green-100 text-green-700"
              }`}>
                {b.status === "pending_verification" ? "Pending" : b.status === "cancelled" ? "Cancelled" : "Confirmed"}
              </span>
              <span className="font-semibold text-primary ml-auto">₹{Number(b.total_amount).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button asChild size="sm" variant="outline">
                <Link to="/success/$bookingId" params={{ bookingId: b.id }}>View ticket</Link>
              </Button>
              {onReschedule && (
                <Button size="sm" variant="outline" onClick={() => onReschedule(b)}>
                  <CalendarCheck className="h-4 w-4 mr-1.5" /> Reschedule
                </Button>
              )}
              {onCancel && (
                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => onCancel(b)}>
                  <XCircle className="h-4 w-4 mr-1.5" /> Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}