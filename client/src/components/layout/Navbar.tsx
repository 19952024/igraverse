import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useMemo } from "react";
import igraverseLogo from "@assets/1000024829_1773162898850.png";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/trueplay-ai", label: "Metabuffed" },
  { href: "/gaca", label: "GACA" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  const displayName = useMemo(() => {
    if (!user?.username) return "";
    const [namePart] = user.username.split("@");
    return namePart || user.username;
  }, [user?.username]);

  const handleLogout = () => {
    logout();
    setLocation("/");
    setIsOpen(false);
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 shadow-sm">
      <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center cursor-pointer group py-2">
            <img src={igraverseLogo} alt="Igraverse" className="h-20 md:h-24 w-auto group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(0,255,170,0.3)]" />
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary cursor-pointer",
                    location === link.href ? "text-primary glow-text" : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>
          
          <div className="flex items-center gap-4 border-l border-white/10 pl-8">
            {user ? (
              <>
                <span className="text-sm font-medium text-muted-foreground">
                  {displayName}
                </span>
                <Button
                  variant="outline"
                  className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary font-medium rounded-xl h-10 px-5"
                  onClick={handleLogout}
                >
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/signin">
                  <Button className="bg-transparent border border-primary/50 text-primary hover:bg-primary/10 hover:text-primary font-medium rounded-xl h-10 px-5">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(0,255,170,0.3)] font-medium rounded-xl h-10 px-5">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center gap-4">
          {!user && (
            <Link href="/signin">
              <Button variant="outline" size="sm" className="border-primary/50 text-primary h-9 rounded-lg">
                Sign In
              </Button>
            </Link>
          )}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background/95 backdrop-blur-xl border-white/10">
              <nav className="flex flex-col gap-6 mt-12">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <span
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "text-lg font-medium transition-colors hover:text-primary cursor-pointer block py-2",
                        location === link.href ? "text-primary glow-text" : "text-muted-foreground"
                      )}
                    >
                      {link.label}
                    </span>
                  </Link>
                ))}
                {user ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-lg font-medium text-primary hover:text-primary/80 cursor-pointer block py-2 text-left"
                  >
                    Log Out
                  </button>
                ) : (
                  <Link href="/signup">
                    <span
                      onClick={() => setIsOpen(false)}
                      className="text-lg font-medium text-primary hover:text-primary/80 cursor-pointer block py-2"
                    >
                      Sign Up
                    </span>
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
