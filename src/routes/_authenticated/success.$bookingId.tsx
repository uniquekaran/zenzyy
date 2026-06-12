import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { CheckCircle2, Download, MapPin, CalendarDays, Users, Home } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/success/$bookingId")({
  component: Success,
});

function Success() {
  const { bookingId } = Route.useParams();
  const ticketRef = useRef<HTMLDivElement>(null);

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, parks(name, location, image_url)")
        .eq("id", bookingId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  function downloadTicket() {
    if (!booking) return;
    const text = `ZENZYY TICKET\n\nBooking: ${booking.booking_code}\nPark: ${(booking as any).parks?.name}\nLocation: ${(booking as any).parks?.location}\nDate: ${format(new Date(booking.visit_date), "EEE, MMM d, yyyy")}\nGuests: ${booking.adult_count} Adult, ${booking.child_count} Child\nTotal: ₹${Number(booking.total_amount).toLocaleString("en-IN")}\nName: ${booking.customer_name}\nEmail: ${booking.customer_email}\n\nShow this ticket at entry.`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${booking.booking_code}.txt`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Ticket downloaded");
  }

  if (isLoading || !booking) return <div className="min-h-screen"><SiteHeader /><div className="mx-auto max-w-2xl px-6 py-20 text-center">Loading ticket…</div></div>;

  const park = (booking as any).parks;
  const qrData = `ZENZYY|${booking.booking_code}|${booking.visit_date}|${booking.adult_count}A${booking.child_count}C`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrData)}&bgcolor=ffffff&color=0f3460`;

  return (
    <div className="min-h-screen flex flex-col bg-secondary/30">
      <SiteHeader />
      <main className="mx-auto max-w-2xl w-full px-4 sm:px-6 py-10 flex-1">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center animate-in zoom-in duration-500">
            <CheckCircle2 className="h-9 w-9 text-green-600" />
          </div>
          <h1 className="font-display text-3xl font-bold mt-4">Booking confirmed!</h1>
          <p className="text-muted-foreground mt-1">Your QR ticket has been generated. See you at the park!</p>
        </div>

        {/* Ticket */}
        <div ref={ticketRef} className="mt-8 rounded-3xl overflow-hidden bg-card border border-border shadow-[var(--shadow-card)]">
          <div className="p-6 text-white relative" style={{ background: "var(--gradient-aqua)" }}>
            <p className="text-xs uppercase tracking-widest opacity-80">Zenzyy Pass</p>
            <h2 className="font-display text-2xl font-bold mt-1">{park?.name}</h2>
            <p className="text-sm opacity-90 flex items-center gap-1 mt-1"><MapPin className="h-3.5 w-3.5" /> {park?.location}</p>
          </div>

          <div className="grid sm:grid-cols-[1fr_auto] gap-6 p-6">
            <div className="space-y-4">
              <Field icon={CalendarDays} label="Visit date" value={format(new Date(booking.visit_date), "EEE, MMM d, yyyy")} />
              <Field icon={Users} label="Guests" value={`${booking.adult_count} Adult${booking.child_count > 0 ? `, ${booking.child_count} Child` : ""}`} />
              <Field label="Name" value={booking.customer_name} />
              <Field label="Booking ID" value={booking.booking_code} mono />
              <Field label="Total paid" value={`₹${Number(booking.total_amount).toLocaleString("en-IN")}`} />
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="rounded-2xl bg-white p-3 border border-border">
                <img src={qrUrl} alt="Booking QR" className="h-40 w-40" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Scan at entry</p>
            </div>
          </div>

          <div className="border-t border-dashed border-border p-5 flex flex-wrap gap-3">
            <Button onClick={downloadTicket} className="flex-1 rounded-xl text-white" style={{ background: "var(--gradient-aqua)" }}>
              <Download className="h-4 w-4 mr-2" /> Download Ticket
            </Button>
            <Button asChild variant="outline" className="flex-1 rounded-xl">
              <Link to="/dashboard"><Home className="h-4 w-4 mr-2" /> Go to dashboard</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ icon: Icon, label, value, mono }: { icon?: any; label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">{Icon && <Icon className="h-3.5 w-3.5" />} {label}</p>
      <p className={`font-semibold mt-0.5 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}