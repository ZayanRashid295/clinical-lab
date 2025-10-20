"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "../../../hooks/useTheme";
import { X, Sun, Moon, Palette } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [mounted, setMounted] = useState(false);
  const { config, setTheme, setColorScheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const colorSchemes = [
    { name: "blue", label: "Blue", color: "#3b82f6" },
    { name: "green", label: "Green", color: "#22c55e" },
    { name: "purple", label: "Purple", color: "#a855f7" },
    { name: "red", label: "Red", color: "#ef4444" },
    { name: "orange", label: "Orange", color: "#f97316" },
    { name: "indigo", label: "Indigo", color: "#6366f1" },
    { name: "pink", label: "Pink", color: "#ec4899" },
    { name: "teal", label: "Teal", color: "#14b8a6" },
  ];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
              <Palette className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Theme Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Theme
            </h3>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setTheme("light")}
                className={`flex items-center justify-center flex-1 px-4 py-3 rounded-md transition-all duration-200 ${
                  mounted && config.theme === "light"
                    ? "bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Sun className="w-4 h-4 mr-2" />
                Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex items-center justify-center flex-1 px-4 py-3 rounded-md transition-all duration-200 ${
                  mounted && config.theme === "dark"
                    ? "bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Moon className="w-4 h-4 mr-2" />
                Dark
              </button>
            </div>
          </div>

          {/* Color Scheme Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Color Scheme
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {colorSchemes.map((scheme) => (
                <button
                  key={scheme.name}
                  onClick={() => setColorScheme(scheme.name as any)}
                  className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200 ${
                    mounted && config.colorScheme === scheme.name
                      ? "border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-700"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full mb-2"
                    style={{ backgroundColor: scheme.color }}
                  />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {scheme.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
