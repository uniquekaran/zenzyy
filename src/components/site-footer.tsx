import { Waves, Twitter, Instagram, Facebook } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary/30 mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                style={{ background: "var(--gradient-aqua)" }}
              >
                <Waves className="h-5 w-5" />
              </span>
              <span className="font-display text-xl font-bold">Zenzyy</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Skip the lines. Dive right in. India's fastest way to book water park tickets.
            </p>
            <div className="flex items-center gap-3 mt-4 text-muted-foreground">
              <a href="#" className="hover:text-primary transition"><Twitter className="h-4 w-4" /></a>
              <a href="#" className="hover:text-primary transition"><Instagram className="h-4 w-4" /></a>
              <a href="#" className="hover:text-primary transition"><Facebook className="h-4 w-4" /></a>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">About us</a></li>
              <li><a href="#" className="hover:text-foreground">Careers</a></li>
              <li><a href="#" className="hover:text-foreground">Press</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Help center</a></li>
              <li><a href="#" className="hover:text-foreground">Refund policy</a></li>
              <li><a href="#" className="hover:text-foreground">Terms</a></li>
              <li><Link to="/connect" className="hover:text-foreground">Connect AI assistant</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border/60 text-xs text-muted-foreground flex justify-between">
          <p>© {new Date().getFullYear()} Zenzyy. All rights reserved.</p>
          <p>Made with 💙 in India</p>
        </div>
      </div>
    </footer>
  );
}