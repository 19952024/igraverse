import { Link } from "wouter";
import { Instagram, Twitter } from "lucide-react";
import igraverseLogo from "@assets/1000024829_1773162898850.png";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 relative overflow-hidden mt-auto bg-background/80 backdrop-blur-xl text-sm z-50">
      {/* Subtle lighting behind footer */}
      <div className="absolute top-0 left-1/4 w-1/2 h-full bg-gradient-to-r from-primary/5 via-secondary/10 to-primary/5 blur-[50px] pointer-events-none"></div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          
          <div className="md:col-span-2">
            <Link href="/">
              <div className="cursor-pointer mb-6 group w-max">
                 <img src={igraverseLogo} alt="Igraverse" className="h-20 md:h-24 w-auto group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(0,255,170,0.5)]" />
              </div>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              Empowering creators to build infinite worlds instantly, ensuring absolute competitive integrity by eradicating cheats, and modeling the top gaming metas of today.
            </p>
          </div>

          <div>
            <h3 className="font-display font-semibold mb-6 text-foreground text-base">System</h3>
            <ul className="space-y-4">
              <li><Link href="/"><span className="text-muted-foreground hover:text-primary hover:glow-text transition-all cursor-pointer block">Home</span></Link></li>
              <li><Link href="/metabuffed"><span className="text-muted-foreground hover:text-secondary hover:glow-text-secondary transition-all cursor-pointer block">Metabuffed</span></Link></li>
              <li><Link href="/gaca"><span className="text-muted-foreground hover:text-primary hover:glow-text transition-all cursor-pointer block">GACA</span></Link></li>
              <li><Link href="/about"><span className="text-muted-foreground hover:text-primary hover:glow-text transition-all cursor-pointer block">About</span></Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold mb-6 text-foreground text-base">Contact</h3>
            <ul className="space-y-4">
              <li><Link href="/contact"><span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer block">Contact Us</span></Link></li>
            </ul>
            <div className="flex gap-4 mt-6">
              <a href="https://www.instagram.com/igraverse" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all hover:scale-110">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://x.com/igraverse" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all hover:scale-110">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} Igraverse. All rights reserved.
          </p>
          <div className="flex gap-8 text-sm">
            <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Privacy Policy</span>
            <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
