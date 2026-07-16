import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { amIAdmin, claimFirstAdmin, getAdminStats, listRecentBookings, verifyBookingByCode, setRushOverride } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ShieldCheck, TrendingUp, Ticket, IndianRupee, ScanLine, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const amIAdminFn = useServerFn(amIAdmin);
  const claim = useServerFn(claimFirstAdmin);
  const statsFn = useServerFn(getAdminStats);
  const listFn = useServerFn(listRecentBookings);
  const verifyFn = useServerFn(verifyBookingByCode);
  const rushFn = useServerFn(setRushOverride);
  const [search, setSearch] = useState("");
  const [scanCode, setScanCode] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);

  const admin = useQuery({ queryKey: ["am-i-admin"], queryFn: () => amIAdminFn() });
  const stats = useQuery({
    queryKey: ["admin-stats"],
    enabled: !!admin.data?.isAdmin,
    queryFn: () => statsFn(),
  });
  const bookings = useQuery({
    queryKey: ["admin-bookings", search],
    enabled: !!admin.data?.isAdmin,
    queryFn: () => listFn({ data: { search: search || undefined, limit: 50 } }),
  });
  const parks = useQuery({
    queryKey: ["parks-list-admin"],
    enabled: !!admin.data?.isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("parks").select("id,name");
      return data ?? [];
    },
  });

  const claimMut = useMutation({
    mutationFn: () => claim(),
    onSuccess: () => { toast.success("You are now admin!"); admin.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  async function scan() {
    if (!scanCode.trim()) return;
    try {
      const r = await verifyFn({ data: { code: scanCode.trim().toUpperCase() } });
      setScanResult(r);
      if (!r.found) toast.error("Booking not found");
      else toast.success("Booking verified");
    } catch (e: any) { toast.error(e.message); }
  }

  async function setRush(parkId: string, level: "low" | "moderate" | "high") {
    try {
      await rushFn({ data: { parkId, level } });
      toast.success(`Rush set to ${level}`);
    } catch (e: any) { toast.error(e.message); }
  }

  if (admin.isLoading) return <Shell><p className="text-center py-16">Loading…</p></Shell>;

  if (!admin.data?.isAdmin) {
    return (
      <Shell>
        <div className="max-w-md mx-auto text-center py-16">
          <ShieldCheck className="h-12 w-12 mx-auto text-primary" />
          <h1 className="font-display text-2xl font-bold mt-4">Admin Panel</h1>
          <p className="text-muted-foreground mt-2">You don't have admin access.</p>
          <p className="text-xs text-muted-foreground mt-4">If this is a fresh install and no admin exists yet, you can claim the first admin role.</p>
          <Button className="mt-4" onClick={() => claimMut.mutate()} disabled={claimMut.isPending}>
            {claimMut.isPending ? "Claiming…" : "Claim first admin"}
          </Button>
        </div>
      </Shell>
    );
  }

  const s = stats.data;
  return (
    <Shell>
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="font-display text-3xl font-bold">Admin Control Panel</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Revenue today" value={s ? `₹${s.revenueToday.toLocaleString("en-IN")}` : "—"} icon={IndianRupee} />
        <Stat label="Tickets today" value={s ? String(s.ticketsToday) : "—"} icon={Ticket} />
        <Stat label="Total revenue" value={s ? `₹${s.revenueTotal.toLocaleString("en-IN")}` : "—"} icon={TrendingUp} />
        <Stat label="Bookings (all-time)" value={s ? String(s.bookingsTotal) : "—"} icon={Ticket} />
      </div>

      {/* Rush override */}
      <div className="mt-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-bold mb-3">Rush level override (4-hour window)</h2>
        <div className="space-y-3">
          {(parks.data ?? []).map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium flex-1">{p.name}</span>
              <Button size="sm" variant="outline" onClick={() => setRush(p.id, "low")}>Low</Button>
              <Button size="sm" variant="outline" onClick={() => setRush(p.id, "moderate")}>Moderate</Button>
              <Button size="sm" variant="outline" onClick={() => setRush(p.id, "high")}>High</Button>
            </div>
          ))}
        </div>
      </div>

      {/* Verify */}
      <div className="mt-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2"><ScanLine className="h-5 w-5" /> Verify booking</h2>
        <div className="flex gap-2">
          <Input value={scanCode} onChange={(e) => setScanCode(e.target.value.toUpperCase())} placeholder="ZNY-12345" className="font-mono" />
          <Button onClick={scan}>Verify</Button>
        </div>
        {scanResult?.found && (
          <div className="mt-4 rounded-xl bg-green-50 border border-green-200 p-4 text-sm">
            <p className="font-semibold text-green-800">✓ Valid booking</p>
            <p className="mt-1">{scanResult.booking.customer_name} · {scanResult.booking.adult_count}A/{scanResult.booking.child_count}C</p>
            <p className="text-muted-foreground">Visit: {scanResult.booking.visit_date} · Status: {scanResult.booking.status}</p>
          </div>
        )}
      </div>

      {/* Recent bookings */}
      <div className="mt-8 rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-display text-lg font-bold">Recent bookings</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search code, name, email…" className="pl-8 w-64" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="py-2">Code</th><th>Customer</th><th>Visit</th><th>Guests</th><th>Tier</th><th className="text-right">Total</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(bookings.data?.bookings ?? []).map((b: any) => (
                <tr key={b.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="py-2 font-mono">{b.booking_code}</td>
                  <td>{b.customer_name}<div className="text-xs text-muted-foreground">{b.customer_email}</div></td>
                  <td>{b.visit_date}</td>
                  <td>{b.adult_count}A/{b.child_count}C</td>
                  <td className="uppercase text-xs">{b.tier_code}</td>
                  <td className="text-right">₹{Number(b.total_amount).toLocaleString("en-IN")}</td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      b.status === "cancelled" ? "bg-red-100 text-red-700" :
                      b.status === "pending_verification" ? "bg-amber-100 text-amber-800" :
                      "bg-green-100 text-green-700"}`}>{b.status}</span>
                  </td>
                </tr>
              ))}
              {(bookings.data?.bookings ?? []).length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No bookings found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="font-display text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}