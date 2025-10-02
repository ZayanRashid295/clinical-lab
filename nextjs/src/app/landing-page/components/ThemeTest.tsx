"use client";

import { useTheme } from "@/shared/contexts/theme-context";
import { useEffect, useState } from "react";

export function ThemeTest() {
  const { config } = useTheme();
  const [domTheme, setDomTheme] = useState<string>("unknown");

  useEffect(() => {
    const checkDomTheme = () => {
      if (typeof document !== "undefined") {
        const hasDarkClass =
          document.documentElement.classList.contains("dark");
        setDomTheme(hasDarkClass ? "dark" : "light");
      }
    };

    checkDomTheme();

    // Check again after a short delay to see if theme is applied
    const timer = setTimeout(checkDomTheme, 1000);

    return () => clearTimeout(timer);
  }, [config.theme]);

  return (
    <div className="fixed top-4 left-4 z-50 p-4 bg-background border border-border rounded-lg shadow-lg">
      <h3 className="text-sm font-bold mb-2 text-foreground">Theme Debug</h3>
      <div className="text-xs space-y-1 text-foreground">
        <div>
          Config Theme:{" "}
          <span className="font-mono text-primary">{config.theme}</span>
        </div>
        <div>
          DOM Theme: <span className="font-mono text-primary">{domTheme}</span>
        </div>
        <div>
          Color Scheme:{" "}
          <span className="font-mono text-primary">{config.colorScheme}</span>
        </div>
        <div>
          Design System:{" "}
          <span className="font-mono text-primary">{config.designSystem}</span>
        </div>
        <div className="mt-2 p-2 bg-muted rounded text-muted-foreground">
          This box should change color with theme
        </div>
      </div>
    </div>
  );
}
