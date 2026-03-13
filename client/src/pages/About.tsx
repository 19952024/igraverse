export default function About() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24 relative z-10 pb-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
           <h1 className="text-5xl md:text-7xl font-display font-bold">
             About <span className="text-primary glow-text">Igraverse</span>
           </h1>
        </div>
        
        <div className="glass-panel p-10 md:p-16 rounded-[3rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] glow-border overflow-hidden">
          <div className="space-y-10 text-left relative z-10">
            <p className="text-3xl text-foreground leading-tight font-display font-bold">
              We do not just build games. <span className="text-primary">We engineer reality.</span>
            </p>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              Igraverse was forged with a singular, uncompromising vision: to obliterate the barrier between imagination and playable reality, while establishing the absolute gold standard for competitive integrity.
            </p>

            <p className="text-xl text-muted-foreground leading-relaxed">
              We deploy proprietary neural networks that do more than generate assets—they understand mechanics, replicate human behavior, and construct flawless worlds in seconds. Alongside this, our GACA infrastructure operates as a silent, impenetrable shield, ensuring every deployed environment remains secure and fair.
            </p>

            <p className="text-xl text-primary/90 leading-relaxed font-semibold">
              The future of interactive entertainment demands democratized creation and enterprise-grade security. We provide both.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
