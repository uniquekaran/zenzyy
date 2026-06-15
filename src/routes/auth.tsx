import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Phone, Waves } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";

type Search = { redirect?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });
  const [tab, setTab] = useState<"phone" | "email">("phone");
  const [step, setStep] = useState<"input" | "otp">("input");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirect || "/dashboard" });
    });
  }, [navigate, redirect]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const schema = z.object({
        email: z.string().trim().email().max(255),
        password: z.string().min(6).max(72),
        name: mode === "signup" ? z.string().trim().min(1).max(80) : z.string().optional(),
      });
      const parsed = schema.safeParse({ email, password, name });
      if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { name }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Welcome to Zenzyy!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      }
      navigate({ to: redirect || "/dashboard" });
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + (redirect || "/dashboard") });
    if (res.error) { toast.error("Google sign-in failed"); setLoading(false); return; }
    if (res.redirected) return;
    navigate({ to: redirect || "/dashboard" });
  }

  async function sendOtp() {
    const parsed = z.string().regex(/^[+]?[\d\s-]{10,15}$/, "Enter a valid 10-digit mobile number").safeParse(phone);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    try {
      const formatted = phone.startsWith("+") ? phone.replace(/[\s-]/g, "") : "+91" + phone.replace(/\D/g, "").slice(-10);
      const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
      if (error) throw error;
      toast.success(`OTP sent to ${formatted}`);
      setStep("otp");
    } catch (err: any) {
      toast.error(err.message || "Couldn't send OTP. Try email sign-in.");
    } finally { setLoading(false); }
  }

  async function verifyOtp() {
    if (otp.length !== 6) { toast.error("Enter the 6-digit OTP"); return; }
    setLoading(true);
    try {
      const formatted = phone.startsWith("+") ? phone.replace(/[\s-]/g, "") : "+91" + phone.replace(/\D/g, "").slice(-10);
      const { error } = await supabase.auth.verifyOtp({ phone: formatted, token: otp, type: "sms" });
      if (error) throw error;
      toast.success("Verified! Welcome to Zenzyy.");
      navigate({ to: redirect || "/dashboard" });
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative items-center justify-center text-white p-12" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 200" preserveAspectRatio="none">
            <path fill="white" fillOpacity="0.2" d="M0,128L80,138.7C160,149,320,171,480,160C640,149,800,107,960,101.3C1120,96,1280,128,1360,138.7L1440,149L1440,200L0,200Z" />
          </svg>
        </div>
        <div className="relative max-w-md">
          <div className="flex items-center gap-2 mb-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur"><Waves className="h-5 w-5" /></span>
            <span className="font-display text-2xl font-bold">Zenzyy</span>
          </div>
          <h2 className="font-display text-4xl font-bold leading-tight">Your splash-day, sorted in seconds.</h2>
          <p className="mt-4 text-white/85">Book India's best water parks with one tap. Instant QR tickets. Zero queues.</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12 animate-fade-in">
        <div className="w-full max-w-md">
          {step === "otp" ? (
            <button onClick={() => { setStep("input"); setOtp(""); }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Change number
            </button>
          ) : null}
          <h1 className="font-display text-3xl font-bold">
            {step === "otp" ? "Verify your mobile" : mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {step === "otp"
              ? `We sent a 6-digit code to ${phone}`
              : tab === "phone"
                ? "Sign in instantly with your mobile number."
                : mode === "signin" ? "Sign in to continue your booking." : "Just a few details to get you splashing."}
          </p>

          {step === "otp" ? (
            <div className="mt-8 space-y-4 animate-fade-in">
              <div>
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • • • •"
                  className="mt-1.5 h-14 text-center text-2xl font-mono tracking-[0.5em]"
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Didn't receive?{" "}
                  <button onClick={sendOtp} disabled={loading} className="text-primary font-medium hover:underline">Resend OTP</button>
                </p>
              </div>
              <Button onClick={verifyOtp} disabled={loading || otp.length !== 6} className="w-full h-12 rounded-xl text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "var(--gradient-aqua)" }}>
                {loading ? "Verifying…" : "Verify & Continue"}
              </Button>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-secondary/60 p-1">
                <button onClick={() => setTab("phone")} className={`h-10 rounded-lg text-sm font-semibold transition-all ${tab === "phone" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Mobile OTP</button>
                <button onClick={() => setTab("email")} className={`h-10 rounded-lg text-sm font-semibold transition-all ${tab === "email" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Email</button>
              </div>

              {tab === "phone" ? (
                <div className="mt-6 space-y-4 animate-fade-in">
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium">Mobile number</Label>
                    <div className="mt-1.5 flex items-center rounded-xl border border-input bg-card focus-within:ring-2 focus-within:ring-ring transition-all overflow-hidden">
                      <div className="flex items-center gap-1.5 pl-4 pr-3 h-14 border-r border-border bg-secondary/40 text-sm font-semibold">
                        <Phone className="h-4 w-4 text-primary" /> +91
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="98765 43210"
                        className="h-14 border-0 shadow-none focus-visible:ring-0 text-lg tracking-wide"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">We'll send a 6-digit OTP to verify your number.</p>
                  </div>
                  <Button onClick={sendOtp} disabled={loading || phone.length < 10} className="w-full h-12 rounded-xl text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "var(--gradient-aqua)" }}>
                    {loading ? "Sending…" : "Send OTP"}
                  </Button>
                  <div className="my-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
                  </div>
                  <Button onClick={handleGoogle} disabled={loading} variant="outline" className="w-full h-11 rounded-xl transition-all hover:scale-[1.01]">
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.4 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.4 29 4.5 24 4.5c-7.4 0-13.8 4.2-17.7 10.2z"/><path fill="#4CAF50" d="M24 43.5c5.1 0 9.7-1.9 13.2-5l-6.1-5c-2 1.4-4.5 2.2-7.1 2.2-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.9 39.4 16.3 43.5 24 43.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.4 4.3-4.4 5.7l6.1 5c4.3-3.9 6.9-9.7 6.9-16.2 0-1.2-.1-2.4-.3-3z"/></svg>
                    Continue with Google
                  </Button>
                </div>
              ) : (
                <div className="mt-6 animate-fade-in">
                  <Button onClick={handleGoogle} disabled={loading} variant="outline" className="w-full h-11 rounded-xl transition-all hover:scale-[1.01]">
            <svg className="h-4 w-4 mr-2" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.4 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.4 29 4.5 24 4.5c-7.4 0-13.8 4.2-17.7 10.2z"/><path fill="#4CAF50" d="M24 43.5c5.1 0 9.7-1.9 13.2-5l-6.1-5c-2 1.4-4.5 2.2-7.1 2.2-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.9 39.4 16.3 43.5 24 43.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.4 4.3-4.4 5.7l6.1 5c4.3-3.9 6.9-9.7 6.9-16.2 0-1.2-.1-2.4-.3-3z"/></svg>
            Continue with Google
          </Button>
                  <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} className="mt-1.5 h-11" />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} maxLength={72} className="mt-1.5 h-11" />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "var(--gradient-aqua)" }}>
              {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
                  </form>
                  <p className="text-sm text-center text-muted-foreground mt-6">
            {mode === "signin" ? "New to Zenzyy?" : "Already have an account?"}{" "}
            <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-primary font-medium hover:underline">
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}