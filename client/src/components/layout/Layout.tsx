import Navbar from "./Navbar";
import Footer from "./Footer";
import globalBg from "@/assets/images/global-bg.png";
import { useEffect, useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [particles, setParticles] = useState<{id: number, left: string, delay: string, size: string, duration: string}[]>([]);

  useEffect(() => {
    // Generate soft floating particles
    const newParticles = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 10}s`,
      size: `${Math.random() * 4 + 1}px`,
      duration: `${Math.random() * 10 + 10}s`
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
      {/* Global Ocean/Emerald Background without Grid */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#021815] via-[#021018] to-[#010a10]"></div>
      </div>
      
      {/* Floating Glow Orbs (Atmospheric Depth) */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-secondary/15 blur-[150px] pointer-events-none z-0 animate-float"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/15 blur-[150px] pointer-events-none z-0 animate-float-delayed"></div>

      {/* Floating Particles */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <div 
            key={p.id}
            className="absolute bottom-[-10px] rounded-full bg-white/40 blur-[1px] animate-particle-up"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              animationDelay: p.delay,
              animationDuration: p.duration
            }}
          />
        ))}
      </div>

      <Navbar />
      
      <main className="flex-1 mt-16 relative z-10 flex flex-col">
        {children}
      </main>

      <div className="relative z-10 mt-auto">
        <Footer />
      </div>
    </div>
  );
}
