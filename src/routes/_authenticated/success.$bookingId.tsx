import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { CheckCircle2, Clock, Download, MapPin, CalendarDays, Users, Home } from "lucide-react";
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

  async function downloadTicket() {
    if (!booking) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 40;
      const isPendingLocal = booking.status === "pending_verification";

      // Header band
      doc.setFillColor(15, 52, 96);
      doc.rect(0, 0, pageW, 110, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("ZENZYY PASS", margin, 45);
      doc.setFontSize(22);
      doc.text(park?.name ?? "Water Park", margin, 75);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(park?.location ?? "", margin, 95);

      // Body
      doc.setTextColor(20, 20, 20);
      let y = 150;
      const rows: [string, string][] = [
        ["Booking ID", booking.booking_code],
        ["Name", booking.customer_name],
        ["Email", booking.customer_email ?? ""],
        ["Visit Date", format(new Date(booking.visit_date), "EEE, MMM d, yyyy")],
        ["Guests", `${booking.adult_count} Adult${booking.child_count > 0 ? `, ${booking.child_count} Child` : ""}`],
        ["Total Paid", `INR ${Number(booking.total_amount).toLocaleString("en-IN")}`],
        ["Status", isPendingLocal ? "Pending Verification" : "Confirmed"],
      ];
      doc.setFontSize(11);
      rows.forEach(([label, value]) => {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(120, 120, 120);
        doc.text(label, margin, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(20, 20, 20);
        doc.text(String(value), margin + 130, y);
        y += 24;
      });

      // QR code
      try {
        const res = await fetch(qrUrl);
        const blob = await res.blob();
        const dataUrl: string = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = reject;
          r.readAsDataURL(blob);
        });
        doc.addImage(dataUrl, "PNG", pageW - margin - 160, 150, 160, 160);
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text("Scan at entry", pageW - margin - 160 + 55, 325);
      } catch {
        // QR fetch failed — continue without it
      }

      y += 20;
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageW - margin, y);
      y += 30;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 20, 20);
      doc.setFontSize(12);
      doc.text("Instructions", margin, y);
      y += 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const lines = [
        "Show this ticket (printed or on your phone) at the park entry gate.",
        "Carry a valid photo ID. Children below 2 years enter free.",
        "Ticket is non-transferable and valid only for the selected date.",
      ];
      lines.forEach((l) => { doc.text(l, margin, y); y += 16; });

      doc.save(`${booking.booking_code}.pdf`);
      toast.success("Ticket PDF downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Could not generate PDF");
    }
  }

  if (isLoading || !booking) return <div className="min-h-screen"><SiteHeader /><div className="mx-auto max-w-2xl px-6 py-20 text-center">Loading ticket…</div></div>;

  const park = (booking as any).parks;
  const isPending = booking.status === "pending_verification";
  const qrData = `ZENZYY|${booking.booking_code}|${booking.visit_date}|${booking.adult_count}A${booking.child_count}C`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrData)}&bgcolor=ffffff&color=0f3460`;

  return (
    <div className="min-h-screen flex flex-col bg-secondary/30">
      <SiteHeader />
      <main className="mx-auto max-w-2xl w-full px-4 sm:px-6 py-10 flex-1">
        <div className="text-center">
          <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center animate-in zoom-in duration-500 ${isPending ? "bg-amber-100" : "bg-green-100"}`}>
            {isPending ? <Clock className="h-9 w-9 text-amber-600" /> : <CheckCircle2 className="h-9 w-9 text-green-600" />}
          </div>
          <h1 className="font-display text-3xl font-bold mt-4">
            {isPending ? "Booking submitted!" : "Booking confirmed!"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isPending
              ? "Your payment is pending verification. We'll confirm your booking shortly."
              : "Your QR ticket has been generated. See you at the park!"}
          </p>
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
              <Field
                label="Status"
                value={isPending ? "Pending Verification" : "Confirmed"}
              />
              {isPending && (booking as any).ticket_data?.utr && (
                <Field label="UTR / Ref. No." value={(booking as any).ticket_data.utr} mono />
              )}
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
