import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { MapPin, CalendarDays, ArrowLeft, Copy, Check, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import upiQrAsset from "@/assets/upi-qr.jpeg.asset.json";

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

const UPI_ID = "vworldcktd@naviaxis";

function Checkout() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [utr, setUtr] = useState("");
  const [copied, setCopied] = useState(false);
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

  function copyUpi() {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    toast.success("UPI ID copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  async function pay() {
    const schema = z.object({
      name: z.string().trim().min(2).max(80),
      email: z.string().trim().email().max(255),
      phone: z.string().trim().regex(/^[+\d][\d\s-]{7,15}$/, "Enter a valid phone number"),
      utr: z.string().trim().regex(/^\d{12}$/, "Enter a valid 12-digit UTR number"),
    });
    const parsed = schema.safeParse({ name, email, phone, utr });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          user_id: user!.id,
          park_id: search.parkId,
          visit_date: search.date,
          adult_count: search.adult,
          child_count: search.child,
          total_amount: total,
          status: "pending_verification",
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          ticket_data: { method: "upi", utr, subtotal, taxes, adultPrice, childPrice, park_name: park!.name },
        })
        .select("id")
        .single();
      if (error) throw error;
      toast.success("Payment details submitted!");
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

            {/* UPI Payment */}
            <div className="rounded-2xl bg-card border border-border p-6">
              <h2 className="font-display text-lg font-bold mb-4">UPI Payment</h2>

              <div className="flex flex-col items-center text-center">
                {/* Real QR Code */}
                <div className="rounded-2xl bg-white p-4 border border-border shadow-sm flex items-center justify-center">
                  <img
                    src={upiQrAsset.url}
                    alt="UPI QR Code for vworldcktd@naviaxis"
                    className="h-56 w-56 object-contain"
                  />
                </div>
                {/* UPI ID */}
                <div className="mt-5 w-full max-w-sm">
                  <p className="text-sm text-muted-foreground">Scan to Pay or send to UPI ID:</p>
                  <button
                    type="button"
                    onClick={copyUpi}
                    className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-base font-semibold transition hover:bg-secondary"
                  >
                    <span className="font-mono tracking-wide">{UPI_ID}</span>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>

                {/* UTR Input */}
                <div className="mt-6 w-full max-w-sm text-left">
                  <Label htmlFor="utr" className="flex items-center gap-1">
                    Enter 12-digit UTR / Transaction Reference Number
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="utr"
                    className="mt-1.5 h-11 font-mono tracking-widest"
                    maxLength={12}
                    inputMode="numeric"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value.replace(/\D/g, ""))}
                    placeholder="0000 0000 0000"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Please complete the payment first, then enter the UTR number here to confirm your booking.
                  </p>
                </div>
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
                {submitting ? "Submitting…" : "Submit Payment Details"}
              </Button>
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
