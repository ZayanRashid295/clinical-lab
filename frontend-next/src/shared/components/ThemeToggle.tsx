import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { cn } from "@/shared/utils/cn";

interface ThemeToggleProps {
  showLabels?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabels = false,
  size = "md",
  className = "",
}) => {
  const { config, setTheme } = useTheme();
  const isDark = config.theme === "dark";

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn("mkt-theme-toggle", sizeClasses[size], className)}
      title={`Current theme: ${isDark ? "Dark" : "Light"}. Click to toggle.`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun size={iconSizes[size]} strokeWidth={1.75} />
      ) : (
        <Moon size={iconSizes[size]} strokeWidth={1.75} />
      )}
      {showLabels && (
        <span className="ml-2 text-sm font-medium" style={{ color: "var(--mkt-text-muted)" }}>
          {isDark ? "Dark" : "Light"}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
