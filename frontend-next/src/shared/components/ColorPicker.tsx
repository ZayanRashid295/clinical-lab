import React, { useState } from "react";
import { Palette, X, ChevronDown } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { COLOR_SCHEMES } from "../../app/config/theme.service";

interface ColorPickerProps {
  className?: string;
  variant?: "icon" | "header";
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  className = "",
  variant = "icon",
}) => {
  const { config, setColorScheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleColorSelect = (colorScheme: string) => {
    setColorScheme(colorScheme as any);
    setIsOpen(false);
  };

  const currentScheme = COLOR_SCHEMES[config.colorScheme];

  // Button classes based on variant
  const getButtonClasses = () => {
    if (variant === "header") {
      return "flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm";
    }
    return "flex items-center justify-center w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm";
  };

  // Panel classes based on variant
  const getPanelClasses = () => {
    if (variant === "header") {
      return "absolute top-10 right-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[240px]";
    }
    return "absolute bottom-12 right-2 sm:right-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-[240px] sm:min-w-[280px] max-w-[90vw] sm:max-w-none";
  };

  // Grid classes based on variant
  const getGridClasses = () => {
    if (variant === "header") {
      return "grid grid-cols-2 gap-2";
    }
    return "grid grid-cols-2 sm:grid-cols-4 gap-3";
  };

  // Color preview size based on variant
  const getColorPreviewSize = () => {
    if (variant === "header") {
      return "w-3 h-3";
    }
    return "w-4 h-4";
  };

  // Active indicator size based on variant
  const getActiveIndicatorSize = () => {
    if (variant === "header") {
      return "w-2 h-2";
    }
    return "w-3 h-3";
  };

  return (
    <div className={`relative ${className}`}>
      {/* Color Picker Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={getButtonClasses()}
        title="Quick Color Theme"
      >
        {variant === "header" ? (
          <>
            <div className="flex space-x-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: currentScheme?.primary[500] }}
              />
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: currentScheme?.primary[600] }}
              />
            </div>
            <span className="text-gray-600 dark:text-gray-300 font-medium">
              {currentScheme?.name}
            </span>
            <ChevronDown size={14} className="text-gray-400" />
          </>
        ) : (
          <Palette size={18} className="text-gray-600 dark:text-gray-300" />
        )}
      </button>

      {/* Color Picker Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className={getPanelClasses()}>
            {/* Header */}
            <div
              className={`flex items-center justify-between ${
                variant === "header" ? "mb-3" : "mb-4"
              }`}
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {variant === "header" ? "Color Theme" : "Quick Color Theme"}
              </h3>
              {variant === "icon" && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Color Grid */}
            <div className={getGridClasses()}>
              {Object.entries(COLOR_SCHEMES).map(([key, scheme]) => (
                <button
                  key={key}
                  onClick={() => handleColorSelect(key)}
                  className={`group relative ${
                    variant === "header"
                      ? "p-2 rounded-md border"
                      : "p-3 rounded-lg border-2"
                  } transition-all ${
                    config.colorScheme === key
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                  title={scheme.name}
                >
                  {/* Color Preview */}
                  <div
                    className={`flex space-x-1 ${
                      variant === "header" ? "mb-1" : "mb-2"
                    }`}
                  >
                    <div
                      className={`${getColorPreviewSize()} rounded-full`}
                      style={{ backgroundColor: scheme.primary[500] }}
                    />
                    <div
                      className={`${getColorPreviewSize()} rounded-full`}
                      style={{ backgroundColor: scheme.primary[600] }}
                    />
                    <div
                      className={`${getColorPreviewSize()} rounded-full`}
                      style={{ backgroundColor: scheme.primary[700] }}
                    />
                  </div>

                  {/* Label */}
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                    {scheme.name}
                  </div>

                  {/* Active Indicator */}
                  {config.colorScheme === key && (
                    <div
                      className={`absolute -top-1 -right-1 ${getActiveIndicatorSize()} bg-primary-500 rounded-full ${
                        variant === "header"
                          ? "border border-white dark:border-gray-800"
                          : "border-2 border-white dark:border-gray-800"
                      }`}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Footer - only for icon variant */}
            {variant === "icon" && (
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Click the gear icon for full theme settings
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ColorPicker;
