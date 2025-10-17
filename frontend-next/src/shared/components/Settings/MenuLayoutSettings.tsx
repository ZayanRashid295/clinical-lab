import React, { useState } from "react";
import { useTheme } from "../../../hooks/useTheme";
import { Monitor, Layout, Palette, Bell, Search, Zap } from "lucide-react";
import Toast from "../Common/Toast";

interface MenuLayoutSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const MenuLayoutSettings: React.FC<MenuLayoutSettingsProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    config,
    setMenuLayout,
    setMenuStyle,
    setTheme,
    setColorScheme,
    setFontSize,
    setBorderRadius,
    updateConfig,
  } = useTheme();

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "warning" | "error";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "info" | "warning" | "error" = "success"
  ) => {
    setToast({ message, type });
  };

  const handleMenuLayoutChange = (layout: "vertical" | "horizontal") => {
    setMenuLayout(layout);
    showToast(`Menu layout changed to ${layout}`, "success");
  };

  const handleMenuStyleChange = (style: "sidebar" | "topbar") => {
    setMenuStyle(style);
    showToast(`Menu style changed to ${style}`, "success");
  };

  const handleThemeChange = (theme: "light" | "dark") => {
    setTheme(theme);
    showToast(`Theme changed to ${theme}`, "success");
  };

  const handleConfigUpdate = (updates: any) => {
    updateConfig(updates);
    const key = Object.keys(updates)[0];
    const value = updates[key];
    showToast(
      `${key} ${
        typeof value === "boolean"
          ? value
            ? "enabled"
            : "disabled"
          : `changed to ${value}`
      }`,
      "success"
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Settings Panel */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Settings</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Menu Layout Section */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Layout size={20} className="text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Menu Layout
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <div className="font-medium text-gray-900">Layout Type</div>
                  <div className="text-sm text-gray-500">
                    Choose between vertical sidebar or horizontal top menu
                  </div>
                </div>
                <select
                  value={config.menuLayout}
                  onChange={(e) =>
                    handleMenuLayoutChange(
                      e.target.value as "vertical" | "horizontal"
                    )
                  }
                  className="px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="vertical">Vertical</option>
                  <option value="horizontal">Horizontal</option>
                </select>
              </div>

              {config.menuLayout === "horizontal" && (
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="font-medium text-gray-900">Menu Style</div>
                    <div className="text-sm text-gray-500">
                      Choose the horizontal menu style
                    </div>
                  </div>
                  <select
                    value={config.menuStyle}
                    onChange={(e) =>
                      handleMenuStyleChange(
                        e.target.value as "sidebar" | "topbar"
                      )
                    }
                    className="px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sidebar">Sidebar Style</option>
                    <option value="topbar">Top Bar Style</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Theme Section */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Palette size={20} className="text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Theme</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <div className="font-medium text-gray-900">Color Scheme</div>
                  <div className="text-sm text-gray-500">
                    Choose your preferred theme
                  </div>
                </div>
                <select
                  value={config.theme}
                  onChange={(e) =>
                    handleThemeChange(e.target.value as "light" | "dark")
                  }
                  className="px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Monitor size={20} className="text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Features</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Search size={16} className="text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">Search</div>
                    <div className="text-sm text-gray-500">
                      Enable global search functionality
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enableSearch}
                    onChange={(e) =>
                      handleConfigUpdate({ enableSearch: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Bell size={16} className="text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">
                      Notifications
                    </div>
                    <div className="text-sm text-gray-500">
                      Enable notification system
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enableNotifications}
                    onChange={(e) =>
                      handleConfigUpdate({
                        enableNotifications: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Zap size={16} className="text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">Animations</div>
                    <div className="text-sm text-gray-500">
                      Enable smooth animations and transitions
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enableAnimations}
                    onChange={(e) =>
                      handleConfigUpdate({ enableAnimations: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Preview
            </h3>
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="text-sm text-gray-600 mb-2">
                Current Configuration:
              </div>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium">Layout:</span>{" "}
                  {config.menuLayout}
                </div>
                <div>
                  <span className="font-medium">Style:</span> {config.menuStyle}
                </div>
                <div>
                  <span className="font-medium">Theme:</span> {config.theme}
                </div>
                <div>
                  <span className="font-medium">Search:</span>{" "}
                  {config.enableSearch ? "Enabled" : "Disabled"}
                </div>
                <div>
                  <span className="font-medium">Notifications:</span>{" "}
                  {config.enableNotifications ? "Enabled" : "Disabled"}
                </div>
                <div>
                  <span className="font-medium">Animations:</span>{" "}
                  {config.enableAnimations ? "Enabled" : "Disabled"}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={() => {
                // Reset to defaults
                updateConfig({
                  menuLayout: "vertical",
                  menuStyle: "sidebar",
                  theme: "dark",
                  enableAnimations: true,
                  enableSearch: true,
                  enableNotifications: true,
                });
              }}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset to Defaults
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MenuLayoutSettings;
