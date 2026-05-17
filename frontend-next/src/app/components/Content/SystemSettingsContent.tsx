import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  RefreshCw,
  Bell,
  Shield,
  Globe,
  Database,
  Mail,
  Smartphone,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Info,
  Palette,
} from "lucide-react";
import { useTheme } from "../../../hooks/useTheme";
import { COLOR_SCHEMES, getColorSchemeKeysForTheme } from "../../config/theme.service";
import type { TypographyPreset } from "../../config/ui.config";

export default function SystemSettingsContent() {
  const {
    config,
    setTheme,
    setColorScheme,
    setFontSize,
    setTypographyPreset,
    setNavbarPosition,
  } = useTheme();

  const [settings, setSettings] = useState({
    // General Settings
    appName: "MedPrepAI",
    appVersion: "2.1.0",
    timezone: "America/New_York",
    language: "en",
    currency: "USD",

    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    maintenanceAlerts: true,

    // Security Settings
    sessionTimeout: 30,
    passwordPolicy: "STRONG",
    twoFactorAuth: true,
    ipWhitelist: false,

    // Payment Settings
    defaultPaymentMethod: "STRIPE",
    autoPayout: true,
    payoutFrequency: "WEEKLY",
    minimumPayout: 50,

    // System Settings
    maintenanceMode: false,
    debugMode: false,
    logLevel: "INFO",
    backupFrequency: "DAILY",
  });

  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    // Show success message
  };

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "themes", label: "Themes", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "system", label: "System", icon: Database },
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Application Name
          </label>
          <input
            type="text"
            value={settings.appName}
            onChange={(e) => handleSettingChange("appName", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Application Version
          </label>
          <input
            type="text"
            value={settings.appVersion}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            value={settings.timezone}
            onChange={(e) => handleSettingChange("timezone", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={settings.language}
            onChange={(e) => handleSettingChange("language", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={settings.currency}
            onChange={(e) => handleSettingChange("currency", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="CAD">CAD (C$)</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderThemeSettings = () => (
    <div className="space-y-8">
      {/* Theme Mode */}
      <div>
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground mb-4">Theme Mode</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              value: "light",
              label: "Light",
              description: "Always use light theme",
            },
            {
              value: "dark",
              label: "Dark",
              description: "Always use dark theme",
            },
          ].map((option) => (
            <div
              key={option.value}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                config.theme === option.value
                  ? "border-primary dark:border-primary bg-primary/10 dark:bg-primary/20"
                  : "border-border dark:border-border hover:border-border/80 dark:hover:border-border/80 bg-card dark:bg-card"
              }`}
              onClick={() => setTheme(option.value as "light" | "dark")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground dark:text-foreground">{option.label}</h4>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">{option.description}</p>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    config.theme === option.value
                      ? "border-primary dark:border-primary bg-primary dark:bg-primary"
                      : "border-muted-foreground dark:border-muted-foreground"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Color Scheme */}
      <div>
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground mb-4">
          Color Scheme
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {getColorSchemeKeysForTheme(config.theme).map((key) => {
            const scheme = COLOR_SCHEMES[key];
            if (!scheme) return null;
            return (
            <div
              key={key}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                config.colorScheme === key
                  ? "border-primary dark:border-primary bg-primary/10 dark:bg-primary/20"
                  : "border-border dark:border-border hover:border-border/80 dark:hover:border-border/80 bg-card dark:bg-card"
              }`}
              onClick={() => setColorScheme(key)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-foreground dark:text-foreground">{scheme.name}</h4>
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    config.colorScheme === key
                      ? "border-primary dark:border-primary bg-primary dark:bg-primary"
                      : "border-muted-foreground dark:border-muted-foreground"
                  }`}
                />
              </div>
              <div className="flex space-x-1">
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: scheme.primary[500] }}
                />
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: scheme.primary[600] }}
                />
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: scheme.primary[700] }}
                />
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground mb-4">Font Size</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { value: "small", label: "Small", description: "Compact text" },
            { value: "medium", label: "Medium", description: "Standard text" },
            { value: "large", label: "Large", description: "Larger text" },
          ].map((option) => (
            <div
              key={option.value}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                config.fontSize === option.value
                  ? "border-primary dark:border-primary bg-primary/10 dark:bg-primary/20"
                  : "border-border dark:border-border hover:border-border/80 dark:hover:border-border/80 bg-card dark:bg-card"
              }`}
              onClick={() =>
                setFontSize(option.value as "small" | "medium" | "large")
              }
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground dark:text-foreground">{option.label}</h4>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">{option.description}</p>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    config.fontSize === option.value
                      ? "border-primary dark:border-primary bg-primary dark:bg-primary"
                      : "border-muted-foreground dark:border-muted-foreground"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Typography preset */}
      <div>
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground mb-4">
          Font style
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(
            [
              { value: "system" as TypographyPreset, label: "System", description: "Sans UI stack" },
              { value: "comfort" as TypographyPreset, label: "Comfort", description: "Serif reading" },
              { value: "compact" as TypographyPreset, label: "Compact", description: "Tighter line height" },
            ] as const
          ).map((option) => (
            <div
              key={option.value}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                config.typographyPreset === option.value
                  ? "border-primary dark:border-primary bg-primary/10 dark:bg-primary/20"
                  : "border-border dark:border-border hover:border-border/80 dark:hover:border-border/80 bg-card dark:bg-card"
              }`}
              onClick={() => setTypographyPreset(option.value)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground dark:text-foreground">{option.label}</h4>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">{option.description}</p>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    config.typographyPreset === option.value
                      ? "border-primary dark:border-primary bg-primary dark:bg-primary"
                      : "border-muted-foreground dark:border-muted-foreground"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navbar layout */}
      <div>
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground mb-4">
          Navbar position
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              config.menuLayout === "vertical" && config.menuStyle === "sidebar"
                ? "border-primary dark:border-primary bg-primary/10 dark:bg-primary/20"
                : "border-border dark:border-border hover:border-border/80 dark:hover:border-border/80 bg-card dark:bg-card"
            }`}
            onClick={() => setNavbarPosition("left")}
          >
            <h4 className="font-medium text-foreground dark:text-foreground">Left sidebar</h4>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">Vertical navigation</p>
          </div>
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              config.menuLayout === "horizontal" && config.menuStyle === "topbar"
                ? "border-primary dark:border-primary bg-primary/10 dark:bg-primary/20"
                : "border-border dark:border-border hover:border-border/80 dark:hover:border-border/80 bg-card dark:bg-card"
            }`}
            onClick={() => setNavbarPosition("top")}
          >
            <h4 className="font-medium text-foreground dark:text-foreground">Top bar</h4>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">Horizontal navigation</p>
          </div>
        </div>
      </div>

      {/* Theme Preview */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
        <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">U</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  User Name
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  user@example.com
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <div className="text-primary-600 dark:text-primary-400 font-medium">
                  Primary
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Primary color
                </div>
              </div>
              <div className="p-3 bg-secondary-50 dark:bg-secondary-900/20 rounded-lg">
                <div className="text-secondary-600 dark:text-secondary-400 font-medium">
                  Secondary
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Secondary color
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-gray-600 dark:text-gray-300 font-medium">
                  Neutral
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Neutral color
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                Primary Button
              </button>
              <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Secondary Button
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center">
            <Mail className="h-5 w-5 text-blue-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Email Notifications
              </h3>
              <p className="text-sm text-gray-500">
                Send notifications via email
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) =>
                handleSettingChange("emailNotifications", e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center">
            <Smartphone className="h-5 w-5 text-green-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                SMS Notifications
              </h3>
              <p className="text-sm text-gray-500">
                Send notifications via SMS
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.smsNotifications}
              onChange={(e) =>
                handleSettingChange("smsNotifications", e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center">
            <Bell className="h-5 w-5 text-purple-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Push Notifications
              </h3>
              <p className="text-sm text-gray-500">
                Send push notifications to mobile apps
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.pushNotifications}
              onChange={(e) =>
                handleSettingChange("pushNotifications", e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Maintenance Alerts
              </h3>
              <p className="text-sm text-gray-500">
                Send alerts for system maintenance
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.maintenanceAlerts}
              onChange={(e) =>
                handleSettingChange("maintenanceAlerts", e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Timeout (minutes)
          </label>
          <input
            type="number"
            value={settings.sessionTimeout}
            onChange={(e) =>
              handleSettingChange("sessionTimeout", parseInt(e.target.value))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password Policy
          </label>
          <select
            value={settings.passwordPolicy}
            onChange={(e) =>
              handleSettingChange("passwordPolicy", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="BASIC">Basic</option>
            <option value="MEDIUM">Medium</option>
            <option value="STRONG">Strong</option>
            <option value="VERY_STRONG">Very Strong</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-blue-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-500">Require 2FA for all users</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.twoFactorAuth}
              onChange={(e) =>
                handleSettingChange("twoFactorAuth", e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center">
            <Globe className="h-5 w-5 text-green-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                IP Whitelist
              </h3>
              <p className="text-sm text-gray-500">
                Restrict access to specific IP addresses
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.ipWhitelist}
              onChange={(e) =>
                handleSettingChange("ipWhitelist", e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Payment Method
          </label>
          <select
            value={settings.defaultPaymentMethod}
            onChange={(e) =>
              handleSettingChange("defaultPaymentMethod", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="STRIPE">Stripe</option>
            <option value="PAYPAL">PayPal</option>
            <option value="SQUARE">Square</option>
            <option value="ADYEN">Adyen</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payout Frequency
          </label>
          <select
            value={settings.payoutFrequency}
            onChange={(e) =>
              handleSettingChange("payoutFrequency", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="BIWEEKLY">Bi-weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Payout Amount ($)
          </label>
          <input
            type="number"
            value={settings.minimumPayout}
            onChange={(e) =>
              handleSettingChange("minimumPayout", parseInt(e.target.value))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center">
          <CreditCard className="h-5 w-5 text-green-500 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">Auto Payout</h3>
            <p className="text-sm text-gray-500">
              Automatically process payouts
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.autoPayout}
            onChange={(e) =>
              handleSettingChange("autoPayout", e.target.checked)
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Log Level
          </label>
          <select
            value={settings.logLevel}
            onChange={(e) => handleSettingChange("logLevel", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="DEBUG">Debug</option>
            <option value="INFO">Info</option>
            <option value="WARN">Warning</option>
            <option value="ERROR">Error</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Backup Frequency
          </label>
          <select
            value={settings.backupFrequency}
            onChange={(e) =>
              handleSettingChange("backupFrequency", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="HOURLY">Hourly</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Maintenance Mode
              </h3>
              <p className="text-sm text-gray-500">
                Put the system in maintenance mode
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) =>
                handleSettingChange("maintenanceMode", e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center">
            <Database className="h-5 w-5 text-purple-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">Debug Mode</h3>
              <p className="text-sm text-gray-500">
                Enable debug logging and features
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.debugMode}
              onChange={(e) =>
                handleSettingChange("debugMode", e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return renderGeneralSettings();
      case "themes":
        return renderThemeSettings();
      case "notifications":
        return renderNotificationSettings();
      case "security":
        return renderSecuritySettings();
      case "payments":
        return renderPaymentSettings();
      case "system":
        return renderSystemSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="px-[50px] pb-[50px] pt-[25px] space-y-3">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              System Settings
            </h1>
            <p className="mt-2 text-gray-600">
              Configure system-wide settings and preferences
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {renderTabContent()}
      </div>

      {/* Info Alert */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <Info className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Settings Information
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Changes to system settings may require a restart to take effect.
              Some settings may impact system performance or security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
