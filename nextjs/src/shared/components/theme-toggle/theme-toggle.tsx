"use client";

import React from "react";
import { useTheme } from "../../contexts/theme-context";

interface ThemeToggleProps {
  floating?: boolean;
  position?: "bottom-right" | "bottom-left";
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  floating = false,
  position = "bottom-right",
}) => {
  const { config, setTheme } = useTheme();

  const toggleTheme = () => {
    const newTheme = config.theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  const isDarkMode = config.theme === "dark";
  const icon = isDarkMode ? "☀️" : "🌙";
  const label = isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode";

  const containerClasses = floating
    ? `fixed ${
        position === "bottom-left" ? "bottom-4 left-4" : "bottom-4 right-4"
      } z-50`
    : "";

  const buttonClasses = floating
    ? "w-12 h-12 rounded-full bg-white hover:bg-gray-100 text-black shadow-xl border-2 border-gray-300 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
    : "inline-flex items-center justify-center w-12 h-12 rounded-full bg-white hover:bg-gray-100 text-black shadow-xl border-2 border-gray-300 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";

  return (
    <div className={containerClasses}>
      <button
        onClick={toggleTheme}
        title={label}
        className={buttonClasses}
        type="button"
        aria-label={label}
      >
        <span className="text-lg">{icon}</span>
      </button>
    </div>
  );
};

export default ThemeToggle;
