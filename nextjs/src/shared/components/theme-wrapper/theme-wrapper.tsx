"use client";

import React from "react";

interface ThemeWrapperProps {
  children: React.ReactNode;
  showFloatingButtons?: boolean;
}

const ThemeWrapper: React.FC<ThemeWrapperProps> = ({
  children,
  showFloatingButtons = true,
}) => {
  return <div className="relative">{children}</div>;
};

export default ThemeWrapper;
