import React, { useState } from "react";
import { useResponsiveLayout } from "../src/shared/hooks/useResponsiveLayout";

const TestResponsivePage: React.FC = () => {
  const [preferredLayout, setPreferredLayout] = useState<
    "horizontal" | "vertical"
  >("horizontal");
  const {
    isMobile,
    isTablet,
    isDesktop,
    screenWidth,
    shouldUseVerticalLayout,
  } = useResponsiveLayout(preferredLayout);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Responsive Navigation Test
        </h1>

        {/* Layout Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Layout Controls</h2>
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setPreferredLayout("horizontal")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                preferredLayout === "horizontal"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Horizontal Layout
            </button>
            <button
              onClick={() => setPreferredLayout("vertical")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                preferredLayout === "vertical"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Vertical Layout
            </button>
          </div>
        </div>

        {/* Responsive Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Responsive Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Screen Width</h3>
              <p className="text-2xl font-bold text-blue-600">
                {screenWidth}px
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Device Type</h3>
              <p className="text-lg font-semibold">
                {isMobile ? "Mobile" : isTablet ? "Tablet" : "Desktop"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">
                Should Use Vertical
              </h3>
              <p
                className={`text-lg font-semibold ${
                  shouldUseVerticalLayout ? "text-green-600" : "text-red-600"
                }`}
              >
                {shouldUseVerticalLayout ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>

        {/* Breakpoint Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Breakpoint Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Mobile (sm):</span>
              <span className="text-gray-600">&lt; 640px</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Tablet (md):</span>
              <span className="text-gray-600">640px - 1024px</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Desktop (lg):</span>
              <span className="text-gray-600">&gt; 1024px</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="font-medium text-blue-900">
                Auto-switch to vertical:
              </span>
              <span className="text-blue-700 font-semibold">
                &lt; 768px (md breakpoint)
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            How to Test
          </h2>
          <div className="space-y-2 text-blue-800">
            <p>1. Set the layout to &quot;Horizontal Layout&quot; above</p>
            <p>2. Resize your browser window to be less than 768px wide</p>
            <p>3. The layout should automatically switch to vertical mode</p>
            <p>4. You should see a notification about the layout switch</p>
            <p>
              5. Resize back to larger than 768px to see it switch back to
              horizontal
            </p>
          </div>
        </div>

        {/* Current Layout Display */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            Current Layout Behavior
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-lg">
              <span className="font-medium">Preferred Layout:</span>{" "}
              {preferredLayout}
            </p>
            <p className="text-lg">
              <span className="font-medium">Actual Layout:</span>{" "}
              {preferredLayout === "horizontal" && !shouldUseVerticalLayout
                ? "Horizontal"
                : "Vertical (Auto-switched)"}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {preferredLayout === "horizontal" && shouldUseVerticalLayout
                ? "Layout automatically switched to vertical for better mobile experience"
                : "Layout matches your preference"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResponsivePage;
