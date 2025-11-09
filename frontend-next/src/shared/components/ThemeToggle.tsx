import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

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

  const getNextTheme = () => {
    return config.theme === "light" ? "dark" : "light";
  };

  const getIcon = () => {
    return config.theme === "light" ? (
      <Sun size={iconSizes[size]} />
    ) : (
      <Moon size={iconSizes[size]} />
    );
  };

  const getLabel = () => {
    return config.theme === "light" ? "Light" : "Dark";
  };

  return (
    <button
      onClick={() => setTheme(getNextTheme())}
      className={`
        ${sizeClasses[size]}
        flex items-center justify-center
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        rounded-lg
        hover:bg-gray-50 dark:hover:bg-gray-700
        transition-colors
        ${className}
      `}
      title={`Current theme: ${getLabel()}. Click to toggle theme.`}
    >
      {getIcon()}
      {showLabels && (
        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {getLabel()}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
