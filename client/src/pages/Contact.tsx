import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import iconMessage from "@/assets/images/icon-message.png";

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Message Sent",
        description: "We've received your inquiry and will get back to you shortly.",
      });
      // Reset form (in a real app, use react-hook-form)
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-10 md:py-16 pb-12">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Info Side */}
        <div className="flex flex-col justify-center space-y-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Get in <span className="text-primary">Touch</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Interested in integrating TruePlay AI, securing your game with GACA, or exploring our generation platform? We'd love to hear from you.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-5 p-5 rounded-2xl bg-card/30 border border-border/50 hover:border-primary/30 transition-colors group">
              <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,170,0.2)] group-hover:scale-110 transition-transform duration-300">
                <img src={iconMessage} alt="Direct Message" className="w-8 h-8 object-contain drop-shadow-[0_0_10px_rgba(0,255,170,0.6)]" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground font-medium mb-1">Direct Email</div>
                <a href="mailto:support@igraverse.com" className="text-xl font-semibold hover:text-primary transition-colors">
                  support@igraverse.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Form Side */}
        <Card className="bg-card/40 border-border/50 backdrop-blur-sm glow-border">
          <CardHeader>
            <CardTitle className="text-2xl font-display">Send a Message</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Name</label>
                <Input required placeholder="Your name" className="bg-background/50" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input required type="email" placeholder="your@email.com" className="bg-background/50" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Message</label>
                <Textarea 
                  required 
                  placeholder="How can we help you?" 
                  className="min-h-[150px] bg-background/50 resize-none" 
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-base shadow-[0_0_15px_rgba(0,212,255,0.3)]">
                {isSubmitting ? (
                  "Sending..."
                ) : (
                  <>
                    Send Message <Send className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
