import { Card, CardContent } from "@/components/ui/card";
import gacaLogo from "@assets/1000024819_1773162911432.png";

import iconIntegrity from "@/assets/images/icon-integrity.png";
import iconPreservation from "@/assets/images/icon-preservation.png";
import iconLag from "@/assets/images/icon-lag.png";
import iconController from "@/assets/images/icon-controller.png";
import iconApi from "@/assets/images/icon-api.png";
import iconSdk from "@/assets/images/icon-sdk.png";
import iconNodes from "@/assets/images/icon-nodes.png";
import iconDeploy from "@/assets/images/icon-deploy.png";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

export default function Gaca() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const handlePreservationClick = () => {
    if (!user) {
      setLocation("/signin");
    } else {
      setLocation("/gaca/preservation-core");
    }
  };

  const handleLagSentinelClick = () => {
    if (!user) {
      setLocation("/signin");
    } else {
      setLocation("/gaca/lag-sentinel");
    }
  };

  const handleControllerIntegrityClick = () => {
    if (!user) {
      setLocation("/signin");
    } else {
      setLocation("/gaca/controller-integrity");
    }
  };

  const makeCardKeyHandler =
    (onActivate: () => void) => (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onActivate();
      }
    };

  return (
    <div className="relative pb-12">
      {/* Ambient background specific to GACA */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-50">
        <div className="absolute top-1/4 left-1/4 w-[30vw] h-[30vw] bg-primary/15 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] bg-primary/10 rounded-full blur-[150px]"></div>
      </div>

      <div className="container mx-auto px-4 pt-10 relative z-10">
        {/* Header */}
        <div className="max-w-4xl mb-16 text-center mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-primary/30 glass-panel text-primary text-sm font-medium mb-10 shadow-[0_0_20px_rgba(0,255,170,0.3)]">
            <div className="w-5 h-5 flex items-center justify-center drop-shadow-[0_0_8px_rgba(0,255,170,0.8)]">
              <img src={iconIntegrity} alt="Global Integrity Layer" className="w-full h-full object-contain" />
            </div>
            <span className="tracking-wide uppercase">Global Integrity Layer</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-8">
            Gaming Anti-Cheating <span className="text-gradient glow-text block mt-2">Authority</span>
          </h1>

          {/* Logo Section */}
          <div className="flex justify-center my-16 relative">
             <div className="absolute inset-0 bg-primary/10 blur-[40px] rounded-full max-w-[200px] mx-auto animate-pulse"></div>
             <div className="relative">
               <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: '3s' }}></div>
               <img src={gacaLogo} alt="GACA Logo" className="w-64 h-64 md:w-80 md:h-80 object-contain relative z-10 drop-shadow-[0_0_30px_rgba(0,255,170,0.5)] animate-float" />
             </div>
          </div>

          <div className="glass-panel p-8 md:p-12 rounded-[2rem] text-left space-y-6 max-w-4xl mx-auto border-primary/20 shadow-[0_0_50px_rgba(0,0,0,0.4)] mt-16">
            <p className="text-xl md:text-2xl text-foreground leading-relaxed font-medium">
              The Gaming Anti-Cheating Authority (GACA) is the integrity infrastructure that protects competitive gaming environments from manipulation, automation abuse, and unfair gameplay advantages.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              GACA continuously monitors behavioral patterns, controller inputs, and network anomalies to detect and prevent unfair advantages before they affect the outcome of a match.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              The system operates silently in the background, acting as a global integrity layer for competitive games and tournaments.
            </p>
            <p className="text-lg text-primary/90 leading-relaxed font-semibold">
              By combining behavioral modeling, pattern recognition, and real-time detection systems, GACA ensures that every match remains fair, authentic, and competitive.
            </p>
          </div>
        </div>

        {/* Core Systems as Network Nodes */}
        <div className="max-w-6xl mx-auto mb-32 relative mt-20">
          <div className="absolute top-1/2 left-[10%] w-[80%] h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent hidden md:block z-0"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 items-stretch">
          {/* Preservation Core is the implemented feature, so it is highlighted and marked ACTIVE API by default */}
          <Card
            className="glass-panel border-primary/30 shadow-[0_0_40px_rgba(0,255,170,0.15)] hover:border-primary/60 transition-all duration-500 group relative overflow-hidden bg-background/60 h-full flex flex-col cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={handlePreservationClick}
            onKeyDown={makeCardKeyHandler(handlePreservationClick)}
          >
              <div className="absolute inset-0 bg-primary/5 mix-blend-overlay"></div>
              <CardContent className="p-10 flex flex-col items-center text-center relative z-10 h-full flex-1">
                <div className="absolute top-4 right-4 text-[10px] font-mono px-3 py-1 bg-primary/20 text-primary rounded-full border border-primary/30 font-bold">ACTIVE API</div>
                <div className="w-24 h-24 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center shadow-[0_0_30px_rgba(0,255,170,0.3)] mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:bg-primary/30 p-4 shrink-0">
                  <img src={iconPreservation} alt="Preservation Core" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-2xl font-display font-semibold mb-4 text-foreground">Preservation Core</h3>
                <p className="text-muted-foreground leading-relaxed mb-6 flex-1">
                  Protects match outcomes by detecting disconnect manipulation and preserving fair results.
                </p>
                <div className="mt-auto pt-6 w-full border-t border-primary/20">
                   <code className="text-xs text-primary/80 group-hover:text-primary transition-colors block">POST /v1/gaca/preservation</code>
                </div>
              </CardContent>
            </Card>

            <Card
              className="glass-panel border-white/5 hover:border-primary/50 transition-all duration-500 group relative overflow-hidden bg-background/40 h-full flex flex-col cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={handleLagSentinelClick}
              onKeyDown={makeCardKeyHandler(handleLagSentinelClick)}
            >
              <CardContent className="p-10 flex flex-col items-center text-center relative z-10 h-full flex-1">
                <div className="absolute top-4 right-4 text-[10px] font-mono px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">SDK MODULE</div>
                <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,170,0.2)] mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:bg-primary/20 p-3 shrink-0">
                  <img src={iconLag} alt="Lag Sentinel" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-2xl font-display font-semibold mb-4 text-foreground">Lag Sentinel</h3>
                <p className="text-muted-foreground leading-relaxed mb-6 flex-1">
                  Detects abnormal network latency patterns and possible lag manipulation.
                </p>
                <div className="mt-auto pt-6 w-full border-t border-primary/20">
                   <code className="text-xs text-primary/80 group-hover:text-primary transition-colors block">WSS /v1/stream/latency</code>
                </div>
              </CardContent>
            </Card>

            <Card
              className="glass-panel border-white/5 hover:border-primary/50 transition-all duration-500 group relative overflow-hidden bg-background/40 h-full flex flex-col cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={handleControllerIntegrityClick}
              onKeyDown={makeCardKeyHandler(handleControllerIntegrityClick)}
            >
              <CardContent className="p-10 flex flex-col items-center text-center relative z-10 h-full flex-1">
                <div className="absolute top-4 right-4 text-[10px] font-mono px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">SDK MODULE</div>
                <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,170,0.2)] mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:bg-primary/20 p-3 shrink-0">
                  <img src={iconController} alt="Controller Integrity" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-2xl font-display font-semibold mb-4 text-foreground">Controller Integrity</h3>
                <p className="text-muted-foreground leading-relaxed mb-6 flex-1">
                  Detects macro behavior, turbo inputs, and scripted controller patterns that provide unfair advantages.
                </p>
                <div className="mt-auto pt-6 w-full border-t border-white/5">
                   <code className="text-xs text-muted-foreground/70 group-hover:text-primary/70 transition-colors block">POST /v1/gaca/input-verify</code>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Integration Steps inside Glass Panel */}
        <div className="max-w-5xl mx-auto glass-panel border border-primary/20 rounded-[2.5rem] p-10 md:p-16 relative overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.4)]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl font-display font-bold mb-16 text-center text-foreground">Integrate GACA Infrastructure</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              <div className="flex flex-col items-center text-center gap-6 relative group">
                <div className="w-20 h-20 rounded-2xl bg-background/50 backdrop-blur border border-primary/40 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(0,255,170,0.15)] group-hover:scale-110 transition-transform duration-300 p-4">
                  <img src={iconApi} alt="API Keys" className="w-full h-full object-contain" />
                </div>
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/50 to-primary/10 z-0"></div>
                <div>
                  <h4 className="font-semibold text-xl mb-2 text-foreground">1. API Keys</h4>
                  <p className="text-sm text-muted-foreground">Generate secure keys in dashboard</p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center gap-6 relative group">
                <div className="w-20 h-20 rounded-2xl bg-background/50 backdrop-blur border border-primary/40 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(0,255,170,0.15)] group-hover:scale-110 transition-transform duration-300 p-4">
                  <img src={iconSdk} alt="Add SDK" className="w-full h-full object-contain" />
                </div>
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/50 to-primary/10 z-0"></div>
                <div>
                  <h4 className="font-semibold text-xl mb-2 text-foreground">2. Add SDK</h4>
                  <p className="text-sm text-muted-foreground">Install via package manager</p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center gap-6 relative group">
                <div className="w-20 h-20 rounded-2xl bg-background/50 backdrop-blur border border-primary/40 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(0,255,170,0.15)] group-hover:scale-110 transition-transform duration-300 p-4">
                  <img src={iconNodes} alt="Connect Nodes" className="w-full h-full object-contain" />
                </div>
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/50 to-transparent z-0"></div>
                <div>
                  <h4 className="font-semibold text-xl mb-2 text-foreground">3. Connect Nodes</h4>
                  <p className="text-sm text-muted-foreground">Wrap your match endpoints</p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center gap-6 relative group">
                <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center z-10 shadow-[0_0_30px_rgba(0,255,170,0.4)] group-hover:scale-110 transition-transform duration-300 p-4">
                  <img src={iconDeploy} alt="Deploy" className="w-full h-full object-contain brightness-0 invert" />
                </div>
                <div>
                  <h4 className="font-semibold text-xl mb-2 text-foreground">4. Deploy</h4>
                  <p className="text-sm text-muted-foreground">Go live with GACA security</p>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <button className="px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(0,255,170,0.3)] hover:shadow-[0_0_40px_rgba(0,255,170,0.5)]">
                 Access Developer Documentation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
