import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import heroImage from '@assets/generated_images/Medical_students_AI_learning_collaboration_6db2826f.png';

export function LandingHero() {
  return (
    <section className="relative w-full h-[70vh] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center text-white">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Revolutionize Medical Education with AI
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-white/95 max-w-3xl mx-auto">
          Practice clinical interviews, shadow AI doctors, and receive OSCE-style assessments in a safe, scalable environment.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button 
            size="lg" 
            className="bg-primary text-primary-foreground border border-primary-border px-8"
            data-testid="button-get-started"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="bg-background/10 backdrop-blur-md border-white/30 text-white hover:bg-background/20"
            data-testid="button-watch-demo"
          >
            <Play className="mr-2 h-5 w-5" />
            Watch Demo
          </Button>
        </div>
      </div>
    </section>
  );
}
