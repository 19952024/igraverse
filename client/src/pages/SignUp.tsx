import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { findLocalUser, upsertLocalUser } from "@/lib/localAuth";

export default function SignUp() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!username || !password) {
      toast({
        title: "Sign up failed",
        description: "Email and password are required.",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Sign up failed",
        description: "Passwords do not match.",
      });
      return;
    }

    // Enforce uniqueness based on locally stored users (normalized to match server)
    const normalizedUsername = username.trim().toLowerCase();
    const existing = findLocalUser(normalizedUsername);
    if (existing) {
      toast({
        title: "Sign up failed",
        description: "This email is already registered.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: normalizedUsername, password }),
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText || "Sign up failed.");
      }

      // Record this user locally as the source of truth for credentials.
      upsertLocalUser(normalizedUsername, password);

      // Backend accepted signup (status 2xx) – log in client-side.
      login({
        id: window.crypto?.randomUUID?.() ?? String(Date.now()),
        username: normalizedUsername,
      });
      toast({
        title: "Account created",
        description: "You are now signed in.",
      });
      setLocation("/");
    } catch (err: any) {
      toast({
        title: "Sign up failed",
        description:
          typeof err?.message === "string"
            ? err.message
            : "We couldn't create your account. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center pt-24 pb-12 px-4 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="glass-panel w-full max-w-md p-8 md:p-10 rounded-[2rem] border-primary/20 shadow-[0_0_50px_rgba(0,0,0,0.4)] relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Create Account</h1>
          <p className="text-muted-foreground">Join the future of game generation</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email Address"
                className="bg-background/50 border-white/10 h-12 text-lg focus-visible:ring-primary/50"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                className="bg-background/50 border-white/10 h-12 text-lg focus-visible:ring-primary/50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Confirm Password"
                className="bg-background/50 border-white/10 h-12 text-lg focus-visible:ring-primary/50"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(0,255,170,0.3)] hover:shadow-[0_0_30px_rgba(0,255,170,0.5)] transition-all rounded-xl"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/signin">
            <span className="text-primary hover:text-primary/80 cursor-pointer font-medium transition-colors">
              Sign In
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

