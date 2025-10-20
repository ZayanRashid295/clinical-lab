"use client";

import React from "react";
import { useUIConfigContext } from "../../contexts/UIConfigContext";
import { COLOR_SCHEMES } from "../../../app/config/theme.service";

interface SettingsButtonProps {
  onClick: () => void;
  className?: string;
}

export const SettingsButton: React.FC<SettingsButtonProps> = ({
  onClick,
  className = "",
}) => {
  const { config } = useUIConfigContext();
  const currentColorScheme = COLOR_SCHEMES[config.colorScheme];
  const primaryColor = currentColorScheme?.primary[500] || "#3b82f6";
  const primaryHoverColor = currentColorScheme?.primary[700] || "#1d4ed8";

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 p-4 text-white rounded-full shadow-lg transition-colors duration-200 z-40 ${className}`}
      style={{
        backgroundColor: primaryColor,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = primaryHoverColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = primaryColor;
      }}
      title="Settings"
      aria-label="Open Settings"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    </button>
  );
};
