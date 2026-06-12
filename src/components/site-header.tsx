import { Link, useNavigate } from "@tanstack/react-router";
import { Waves, User as UserIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 group">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-[var(--shadow-glow)] transition-transform group-hover:scale-105"
            style={{ background: "var(--gradient-aqua)" }}
          >
            <Waves className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">Zenzyy</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <a href="/#trending" className="hover:text-foreground transition-colors">Water Parks</a>
          {user && <Link to="/dashboard" className="hover:text-foreground transition-colors">My Bookings</Link>}
        </nav>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 rounded-full">
                <UserIcon className="h-4 w-4" />
                <span className="hidden sm:inline max-w-[120px] truncate">{user.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
                <UserIcon className="h-4 w-4 mr-2" /> Dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            onClick={() => navigate({ to: "/auth" })}
            className="rounded-full px-5 text-white shadow-[var(--shadow-soft)] hover:opacity-95"
            style={{ background: "var(--gradient-aqua)" }}
          >
            Login
          </Button>
        )}
      </div>
    </header>
  );
}