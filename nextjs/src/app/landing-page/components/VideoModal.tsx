"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/shared/contexts/theme-context";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc: string;
  title?: string;
}

export function VideoModal({
  isOpen,
  onClose,
  videoSrc,
  title = "Demo Video",
}: VideoModalProps) {
  const { config } = useTheme();
  const isDarkMode = config.theme === "dark";

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop with glassmorphic effect */}
      <div
        className={cn(
          "absolute inset-0 backdrop-blur-sm",
          isDarkMode ? "bg-black/20" : "bg-black/30"
        )}
      />

      {/* Modal content */}
      <div className="relative w-full max-w-4xl transform transition-all duration-300 ease-out">
        <div
          className={cn(
            "backdrop-blur-md border rounded-2xl shadow-2xl p-6",
            isDarkMode
              ? "bg-white/10 border-white/20"
              : "bg-black/20 border-black/30"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2
              className={cn(
                "text-2xl font-bold",
                isDarkMode ? "text-white" : "text-black"
              )}
            >
              {title}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className={cn(
                "h-8 w-8",
                isDarkMode
                  ? "text-white/70 hover:text-white hover:bg-white/10"
                  : "text-black/70 hover:text-black hover:bg-black/10"
              )}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Video */}
          <div className="relative w-full aspect-video rounded-lg overflow-hidden">
            <video
              className="w-full h-full object-cover"
              controls
              autoPlay
              playsInline
            >
              <source src={videoSrc} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Footer */}
          <div
            className={cn(
              "mt-4 text-center text-sm",
              isDarkMode ? "text-white/70" : "text-black/70"
            )}
          >
            <p>Click outside the video or press ESC to close</p>
          </div>
        </div>
      </div>
    </div>
  );
}
