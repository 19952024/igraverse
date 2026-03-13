import { Card, CardContent } from "@/components/ui/card";
import trueplayDongle from "@assets/1000015368-removebg-preview_1773167038538.png";

import iconBehavioral from "@/assets/images/icon-behavioral.png";
import iconPlaystyle from "@/assets/images/icon-playstyle.png";
import iconReplication from "@/assets/images/icon-replication.png";
import iconMeta from "@/assets/images/icon-meta.png";
import iconSimulation from "@/assets/images/icon-simulation.png";

export default function TruePlay() {
  return (
    <div className="relative pb-12">
      {/* Remove static image background to use the global gradient atmosphere */}
      <div className="container mx-auto px-4 pt-10 relative z-10">
        
        {/* Hero Section - Two Column Layout */}
        <div className="flex flex-col lg:flex-row items-center gap-8 mb-20 max-w-6xl mx-auto">
          {/* Left Column - Text */}
          <div className="flex-1 text-left">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-secondary/40 bg-secondary/10 text-secondary text-sm font-medium mb-6 backdrop-blur-md shadow-[0_0_20px_rgba(0,212,255,0.25)]">
              <div className="w-5 h-5 flex items-center justify-center drop-shadow-[0_0_8px_rgba(0,212,255,0.8)]">
                <img src={iconBehavioral} alt="Behavioral Modeling Engine" className="w-full h-full object-contain" />
              </div>
              <span className="tracking-wide uppercase">Behavioral Modeling Engine</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">
              <span className="text-gradient glow-text-secondary">TruePlay</span> AI
            </h1>
            <p className="text-xl text-foreground leading-relaxed mb-6 font-medium">
              TruePlay AI acts like an intelligent Player 2 connected to your system.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              By observing controller inputs, gameplay decisions, and behavioral patterns, the system learns how players think and compete. The AI can then recreate authentic playstyles, simulate matches, and analyze strategies across thousands of games.
            </p>
            <p className="text-lg text-secondary/90 leading-relaxed font-semibold">
              This transforms raw gameplay behavior into trainable AI opponents and competitive insight.
            </p>
          </div>
          
          {/* Right Column - Product Visual */}
          <div className="flex-1 relative flex justify-center w-full">
             {/* Subtle ambient glow behind dongle */}
             <div className="absolute inset-0 bg-secondary/20 blur-[80px] rounded-full max-w-[200px] mx-auto"></div>
             <img 
               src={trueplayDongle} 
               alt="TruePlay AI Device" 
               className="w-full max-w-[280px] md:max-w-sm relative z-10 animate-float drop-shadow-[0_15px_35px_rgba(0,212,255,0.4)] object-contain" 
             />
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <Card className="glass-panel border-white/5 hover:border-secondary/40 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-[50px] group-hover:bg-secondary/20 transition-colors"></div>
            <CardContent className="p-10 relative z-10">
              <div className="w-16 h-16 mb-8 group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(0,212,255,0.4)]">
                 <img src={iconPlaystyle} alt="Playstyle Learning" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-3xl font-display font-semibold mb-4 text-foreground">Playstyle Learning</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Our neural network continuously observes and analyzes gameplay patterns, micro-decisions, and reaction timings. It captures the essence of a player's strategic approach rather than just recording inputs.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/5 hover:border-secondary/40 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-[50px] group-hover:bg-secondary/20 transition-colors"></div>
            <CardContent className="p-10 relative z-10">
              <div className="w-16 h-16 mb-8 group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(0,212,255,0.4)]">
                 <img src={iconReplication} alt="Style Replication" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-3xl font-display font-semibold mb-4 text-foreground">Style Replication</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Once a profile is built, TruePlay can flawlessly recreate the player's exact style. The AI behaves with the same aggressiveness, caution, and unique quirks as the human original.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/5 hover:border-secondary/40 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-[50px] group-hover:bg-secondary/20 transition-colors"></div>
            <CardContent className="p-10 relative z-10">
              <div className="w-16 h-16 mb-8 group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(0,212,255,0.4)]">
                 <img src={iconMeta} alt="Meta Detection" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-3xl font-display font-semibold mb-4 text-foreground">Meta Detection</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                The system analyzes global behavior across thousands of matches to detect evolving strategies and meta-shifts in real-time, allowing developers to balance games preemptively.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/5 hover:border-secondary/40 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-[50px] group-hover:bg-secondary/20 transition-colors"></div>
            <CardContent className="p-10 relative z-10">
              <div className="w-16 h-16 mb-8 group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(0,212,255,0.4)]">
                 <img src={iconSimulation} alt="Match Simulation" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-3xl font-display font-semibold mb-4 text-foreground">Match Simulation</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Pit distinct AI playstyles against each other in high-speed simulated environments. Test how different strategies interact without requiring human players to run thousands of matches.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
