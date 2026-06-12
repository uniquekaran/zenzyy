import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CreditCard, Smartphone, Landmark, Lock, MapPin, CalendarDays, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";

type Search = { parkId: string; date: string; adult: number; child: number };

export const Route = createFileRoute("/_authenticated/checkout")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    parkId: String(s.parkId ?? ""),
    date: String(s.date ?? ""),
    adult: Number(s.adult ?? 0),
    child: Number(s.child ?? 0),
  }),
  component: Checkout,
});

function Checkout() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (user?.email) setEmail(user.email); }, [user]);

  const { data: park } = useQuery({
    queryKey: ["park", search.parkId],
    queryFn: async () => {
      const { data, error } = await supabase.from("parks").select("*").eq("id", search.parkId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!park) return <div className="min-h-screen"><SiteHeader /><div className="mx-auto max-w-3xl px-6 py-20 text-center"><p>Loading checkout…</p></div></div>;

  const adultPrice = Number(park.price);
  const childPrice = Math.round(adultPrice * 0.6);
  const subtotal = search.adult * adultPrice + search.child * childPrice;
  const taxes = Math.round(subtotal * 0.05);
  const total = subtotal + taxes;

  async function pay() {
    const schema = z.object({
      name: z.string().trim().min(2).max(80),
      email: z.string().trim().email().max(255),
      phone: z.string().trim().regex(/^[+\d][\d\s-]{7,15}$/, "Enter a valid phone number"),
    });
    const parsed = schema.safeParse({ name, email, phone });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }

    setSubmitting(true);
    try {
      // mock payment delay
      await new Promise((r) => setTimeout(r, 1200));
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          user_id: user!.id,
          park_id: search.parkId,
          visit_date: search.date,
          adult_count: search.adult,
          child_count: search.child,
          total_amount: total,
          status: "confirmed",
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          ticket_data: { method, subtotal, taxes, adultPrice, childPrice, park_name: park!.name },
        })
        .select("id")
        .single();
      if (error) throw error;
      toast.success("Payment successful!");
      navigate({ to: "/success/$bookingId", params: { bookingId: data.id } });
    } catch (e: any) {
      toast.error(e.message || "Booking failed");
    } finally { setSubmitting(false); }
  }

  return (
    <div className="min-h-screen flex flex-col bg-secondary/30">
      <SiteHeader />
      <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <Link to="/park/$parkId" params={{ parkId: search.parkId }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to park
        </Link>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          <div className="space-y-6">
            {/* Contact */}
            <div className="rounded-2xl bg-card border border-border p-6">
              <h2 className="font-display text-lg font-bold mb-4">Your details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Full name</Label><Input className="mt-1.5 h-11" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="As on ID proof" /></div>
                <div><Label>Phone</Label><Input className="mt-1.5 h-11" maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" /></div>
                <div className="sm:col-span-2"><Label>Email</Label><Input className="mt-1.5 h-11" type="email" maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-2xl bg-card border border-border p-6">
              <h2 className="font-display text-lg font-bold mb-4">Payment method</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                <MethodCard active={method === "upi"} onClick={() => setMethod("upi")} icon={Smartphone} label="UPI" sub="GPay, PhonePe..." />
                <MethodCard active={method === "card"} onClick={() => setMethod("card")} icon={CreditCard} label="Card" sub="Credit / Debit" />
                <MethodCard active={method === "netbanking"} onClick={() => setMethod("netbanking")} icon={Landmark} label="Net Banking" sub="All major banks" />
              </div>
              <div className="mt-5 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground bg-secondary/30">
                <p className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-primary" /> Secure mock checkout — no real money will be charged.</p>
                {method === "upi" && <p className="mt-2">Enter UPI ID like <code className="text-foreground">user@upi</code> in production.</p>}
                {method === "card" && <p className="mt-2">Card details would be collected by Razorpay/Stripe iframe.</p>}
                {method === "netbanking" && <p className="mt-2">You'd be redirected to your bank in production.</p>}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div>
            <div className="lg:sticky lg:top-24 rounded-2xl bg-card border border-border p-6 shadow-[var(--shadow-card)]">
              <h2 className="font-display text-lg font-bold mb-4">Order summary</h2>
              <div className="flex gap-3">
                <img src={park.image_url} alt="" className="h-20 w-20 rounded-xl object-cover" />
                <div>
                  <p className="font-semibold">{park.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" /> {park.location}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><CalendarDays className="h-3 w-3" /> {format(new Date(search.date), "EEE, MMM d, yyyy")}</p>
                </div>
              </div>
              <div className="mt-5 pt-5 border-t border-border space-y-2 text-sm">
                {search.adult > 0 && <Row label={`Adult × ${search.adult}`} value={`₹${(search.adult * adultPrice).toLocaleString("en-IN")}`} />}
                {search.child > 0 && <Row label={`Child × ${search.child}`} value={`₹${(search.child * childPrice).toLocaleString("en-IN")}`} />}
                <Row label="Taxes & fees" value={`₹${taxes.toLocaleString("en-IN")}`} />
              </div>
              <div className="mt-4 pt-4 border-t border-border flex items-baseline justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-display text-2xl font-bold">₹{total.toLocaleString("en-IN")}</span>
              </div>
              <Button onClick={pay} disabled={submitting} className="w-full mt-5 h-12 rounded-xl text-white font-semibold" style={{ background: "var(--gradient-aqua)" }}>
                {submitting ? "Processing payment..." : `Pay ₹${total.toLocaleString("en-IN")}`}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3 flex items-center justify-center gap-1"><Lock className="h-3 w-3" /> 256-bit encrypted</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>;
}

function MethodCard({ active, onClick, icon: Icon, label, sub }: any) {
  return (
    <button type="button" onClick={onClick}
      className={`text-left rounded-xl border-2 p-4 transition ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
      <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
      <p className="font-semibold mt-2 text-sm">{label}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </button>
  );
}