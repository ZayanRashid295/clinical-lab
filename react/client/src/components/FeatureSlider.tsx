import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
  title: string;
  description: string;
  image?: string;
  highlights: string[];
}

interface FeatureSliderProps {
  features: Feature[];
}

export function FeatureSlider({ features }: FeatureSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {features.map((feature, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0 px-4">
              <Card className="p-8 md:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-3xl font-bold mb-4">{feature.title}</h3>
                    <p className="text-lg text-muted-foreground mb-6">
                      {feature.description}
                    </p>
                    <ul className="space-y-3">
                      {feature.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          </div>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {feature.image && (
                    <div className="rounded-lg overflow-hidden shadow-lg">
                      <img 
                        src={feature.image} 
                        alt={feature.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-6">
        <Button
          variant="outline"
          size="icon"
          onClick={scrollPrev}
          data-testid="button-slider-prev"
          className="h-10 w-10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex gap-2">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                index === selectedIndex 
                  ? "w-8 bg-primary" 
                  : "w-2 bg-muted-foreground/30 hover-elevate"
              )}
              data-testid={`button-slider-dot-${index}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={scrollNext}
          data-testid="button-slider-next"
          className="h-10 w-10"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
