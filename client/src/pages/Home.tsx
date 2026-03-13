import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { 
  Sparkles, 
  ArrowRight, 
  Terminal, 
  Activity,
  Heart,
  Check,
  Cpu
} from "lucide-react";

import heroVideo from "@/assets/videos/ps1-bamboo-forest.mp4";
import gameNinja from "@/assets/images/game-ninja.png";
import gameZombie from "@/assets/images/game-zombie.png";
import gameBoxing from "@/assets/images/game-boxing.png";
import gameDungeon from "@/assets/images/game-dungeon.png";
import game1 from "@/assets/images/game-1.png";
import game2 from "@/assets/images/game-2.png";

import iconGame from "@/assets/images/icon-generation.png";
import iconAi from "@/assets/images/icon-trueplay.png";
import iconShield from "@/assets/images/icon-gaca.png";

import boxingVideo from "@/assets/videos/ps2-boxing-indoor.mp4";

const generatedGames = [
  { img: gameNinja, title: "Shinobi's Vow", genre: "Platformer", likes: 12.4 },
  { img: gameZombie, title: "Dead Sector", genre: "Survival Shooter", likes: 8.9 },
  { img: gameBoxing, title: "Neon Knockout", genre: "Fighting", likes: 15.2 },
  { img: gameDungeon, title: "Abyssal Run", genre: "Dungeon Crawler", likes: 6.7 },
  { img: game1, title: "Cyber Jump", genre: "Arcade", likes: 4.3 },
  { img: game2, title: "Star Defender", genre: "Space Shooter", likes: 11.1 },
];

const activityStream = [
  { action: "Created", target: "Dungeon Platformer", time: "Just now" },
  { action: "Created", target: "Retro Space Shooter", time: "2m ago" },
  { action: "Created", target: "Neon Knockout", time: "5m ago" },
  { action: "Created", target: "Pixel Zombie Arena", time: "12m ago" },
  { action: "Created", target: "Shinobi's Vow", time: "18m ago" },
];

const promptExamples = [
  "Create a retro ninja platformer in a bamboo forest",
  "Build a pixel zombie survival shooter",
  "Generate a futuristic boxing arena"
];

export default function Home() {
  return (
    <div className="flex flex-col gap-20 pb-10">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-32 pb-16 overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0 opacity-40">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="absolute inset-0 w-full h-full object-cover object-center animate-fade-in-out"
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="absolute inset-0 w-full h-full object-cover object-center animate-fade-in-out-delayed opacity-0"
          >
            <source src={boxingVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 w-full">
          <div className="max-w-5xl mx-auto text-center flex flex-col items-center gap-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium animate-in fade-in zoom-in duration-1000 backdrop-blur-sm">
              <Cpu className="w-4 h-4" />
              <span className="tracking-wide">Igraverse Engine v3.0 Active</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold font-display tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150">
              Create Games with <span className="text-gradient glow-text">AI</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              From retro worlds to next-generation experiences. Type your vision, and watch our neural engine build playable reality in seconds.
            </p>

            {/* AI Generation Input */}
            <div className="w-full max-w-4xl mt-6 mb-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
              <div className="p-[2px] rounded-2xl bg-gradient-to-r from-primary/50 via-secondary/50 to-primary/50 bg-[length:200%_auto] animate-gradient-xy glow-border z-20 relative">
                <div className="bg-card/90 backdrop-blur-xl rounded-[14px] p-4 flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative flex-1 w-full">
                    <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary/70" />
                    <Input 
                      placeholder="Describe the game you want to build..." 
                      className="pl-14 h-16 bg-transparent border-none text-xl focus-visible:ring-0 shadow-none placeholder:text-muted-foreground/60"
                    />
                  </div>
                  <Button className="w-full md:w-auto h-14 px-10 text-lg font-semibold rounded-xl shadow-[0_0_20px_rgba(0,212,255,0.4)] hover:shadow-[0_0_40px_rgba(0,212,255,0.6)] transition-all bg-primary text-primary-foreground">
                    Generate Game
                  </Button>
                </div>
              </div>

              {/* Example Prompts */}
              <div className="flex flex-wrap justify-center gap-3 pt-6 relative z-10 pb-4">
                {promptExamples.map((prompt, idx) => (
                  <button 
                    key={idx}
                    className="text-sm px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 text-secondary-foreground hover:bg-secondary/20 hover:border-secondary/40 transition-all backdrop-blur-sm shadow-sm"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Pillars */}
      <section className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Pillar 1 */}
          <Card className="glass-panel border-white/5 hover:border-primary/40 transition-all duration-500 group relative overflow-hidden p-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="p-6 flex flex-col gap-4 h-full relative z-10 text-center items-center">
              <div className="w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(0,255,170,0.5)]">
                <img src={iconGame} alt="Game Generation" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold mb-2 text-primary group-hover:text-primary transition-colors tracking-widest uppercase">Game Generation</h3>
                <p className="text-muted-foreground/80 text-sm leading-relaxed">
                  Create playable games instantly using natural language prompts and curated templates. No coding experience required to bring your vision to life.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pillar 2 */}
          <Card className="glass-panel border-white/5 hover:border-secondary/40 transition-all duration-500 group relative overflow-hidden p-0">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="p-6 flex flex-col gap-4 h-full relative z-10 text-center items-center">
              <div className="w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(0,212,255,0.5)]">
                 <img src={iconAi} alt="Metabuffed" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold mb-2 text-secondary group-hover:text-secondary transition-colors tracking-widest uppercase">Metabuffed</h3>
                <p className="text-muted-foreground/80 text-sm leading-relaxed">
                  Our proprietary neural network analyzes behavior to create intelligent AI playstyles. Train against specific patterns or immortalize your own style.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pillar 3 */}
          <Card className="glass-panel border-white/5 hover:border-primary/40 transition-all duration-500 group relative overflow-hidden p-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="p-6 flex flex-col gap-4 h-full relative z-10 text-center items-center">
              <div className="w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(0,255,170,0.5)]">
                 <img src={iconShield} alt="GACA" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold mb-2 text-primary group-hover:text-primary transition-colors tracking-widest uppercase">GACA</h3>
                <p className="text-muted-foreground/80 text-sm leading-relaxed">
                  Gaming Integrity Authority provides enterprise-grade competitive integrity infrastructure. Ensure absolute fair play across all your deployed worlds.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Top Community Games */}
      <section className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">Top Games by <span className="text-primary">Community</span></h2>
            <p className="text-muted-foreground text-xl">The most acclaimed worlds built by Igraverse creators.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generatedGames.map((game, i) => (
            <Card key={i} className="glass-panel border-white/5 overflow-hidden group hover:border-primary/30 transition-all duration-500 cursor-pointer">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={game.img} 
                  alt={game.title} 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" 
                />
                <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5 shadow-lg">
                   <Heart className="w-3.5 h-3.5 fill-destructive text-destructive" />
                   <span className="text-xs font-semibold">{game.likes}k</span>
                </div>
              </div>
              <CardContent className="p-5 flex justify-between items-center bg-background/40">
                <div>
                  <h4 className="font-display text-xl font-bold mb-1.5">{game.title}</h4>
                  <span className="text-xs text-primary px-2.5 py-1 bg-primary/10 rounded-md border border-primary/20 font-medium uppercase tracking-wider">{game.genre}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Platform Activity Feed */}
      <section className="container mx-auto px-4 relative z-10 mb-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Activity className="w-6 h-6 text-secondary animate-pulse" />
            <h2 className="text-3xl font-display font-bold">Platform <span className="text-secondary">Activity</span></h2>
          </div>
          
          <div className="glass-panel border border-white/5 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-[80px]"></div>
            
            <div className="space-y-4 relative z-10">
              {activityStream.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-background/40 border border-white/5 hover:border-secondary/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(175,76,255,0.8)]"></div>
                    <div>
                      <span className="text-muted-foreground mr-2">{item.action}</span>
                      <span className="font-semibold text-foreground">"{item.target}"</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground font-mono bg-background/50 px-3 py-1 rounded-lg border border-white/5">
                    {item.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Membership Section */}
      <section className="container mx-auto px-4 relative z-10 mb-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold">Membership</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {/* Card 1: Free */}
          <Card className="glass-panel border-white/5 flex flex-col h-[600px] hover:-translate-y-2 hover:border-primary/30 hover:shadow-[0_15px_40px_rgba(0,255,170,0.15)] transition-all duration-300 bg-background/40">
            <CardContent className="p-8 flex flex-col h-full relative z-10">
              <div className="mb-6 text-left border-b border-white/5 pb-6 min-h-[140px] flex flex-col justify-end">
                <h3 className="text-xl font-display font-semibold text-muted-foreground mb-2">Free</h3>
                <div className="text-4xl font-bold text-foreground">$0</div>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1 text-muted-foreground">
                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /> <span>create up to 2 games total</span></li>
                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /> <span>public builds only</span></li>
                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /> <span>basic access</span></li>
              </ul>

              <div className="mt-auto pt-6 border-t border-white/5">
                <Button className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(0,255,170,0.3)] font-semibold rounded-xl">
                  Get Started
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Creator */}
          <div className="relative h-[600px] md:-mt-4">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
              <div className="bg-primary/20 border border-primary/50 text-primary px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(0,255,170,0.3)] backdrop-blur-md">
                Most Popular
              </div>
            </div>
            <Card className="glass-panel border-primary/40 flex flex-col h-full hover:-translate-y-2 hover:border-primary/60 shadow-[0_10px_40px_rgba(0,255,170,0.2)] hover:shadow-[0_20px_50px_rgba(0,255,170,0.3)] transition-all duration-300 bg-background/60">
              <CardContent className="p-8 flex flex-col h-full relative z-10">
                <div className="mb-6 text-left border-b border-white/10 pb-6 min-h-[140px] flex flex-col justify-end">
                  <h3 className="text-xl font-display font-semibold text-primary mb-2">Game Creation</h3>
                  <div className="text-4xl font-bold text-foreground">$5<span className="text-lg text-muted-foreground font-normal ml-2">/ month</span></div>
                </div>
                
                <ul className="space-y-4 mb-8 flex-1 text-foreground/90">
                  <li className="flex items-start gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /> <span>unlimited game generation</span></li>
                  <li className="flex items-start gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /> <span>private projects</span></li>
                  <li className="flex items-start gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /> <span>export playable builds</span></li>
                  <li className="flex items-start gap-3"><Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /> <span>future engine upgrades</span></li>
                </ul>

                <div className="mt-auto pt-6 border-t border-white/10">
                  <Button className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(0,255,170,0.4)] font-semibold rounded-xl">
                    Subscribe
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Card 3: GACA */}
          <Card className="glass-panel border-white/5 flex flex-col h-[600px] hover:-translate-y-2 hover:border-primary/30 hover:shadow-[0_15px_40px_rgba(0,255,170,0.15)] transition-all duration-300 bg-background/40">
            <CardContent className="p-8 flex flex-col h-full relative z-10">
              <div className="mb-6 text-left border-b border-white/5 pb-6 min-h-[140px] flex flex-col justify-end">
                <h3 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary tracking-widest mb-1">GACA</h3>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-4">Gaming Anti Cheating Authority</p>
              </div>
              
              <div className="space-y-4 mb-8 flex-1">
                <div className="px-5 py-3 rounded-xl bg-background/60 border border-white/5 flex justify-between items-center hover:border-primary/30 hover:shadow-[0_0_15px_rgba(0,255,170,0.1)] transition-all">
                  <span className="font-medium text-foreground text-sm">Developer</span>
                  <span className="text-base font-bold text-foreground">$29<span className="text-xs text-muted-foreground font-normal ml-1">/ month</span></span>
                </div>
                <div className="px-5 py-3 rounded-xl bg-background/60 border border-white/5 flex justify-between items-center hover:border-primary/30 hover:shadow-[0_0_15px_rgba(0,255,170,0.1)] transition-all">
                  <span className="font-medium text-foreground text-sm">Studio</span>
                  <span className="text-base font-bold text-foreground">$149<span className="text-xs text-muted-foreground font-normal ml-1">/ month</span></span>
                </div>
                <div className="px-5 py-3 rounded-xl bg-primary/10 border border-primary/30 flex justify-between items-center shadow-[0_0_15px_rgba(0,255,170,0.15)] relative overflow-hidden hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,255,170,0.25)] transition-all">
                  <div className="absolute inset-0 bg-primary/5"></div>
                  <span className="font-medium text-primary text-sm relative z-10">Tournament</span>
                  <span className="text-base font-bold text-primary relative z-10">$499<span className="text-xs text-primary/80 font-normal ml-1">/ month</span></span>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-white/5">
                <Button className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(0,255,170,0.3)] font-semibold rounded-xl">
                  Choose Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
