"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../shared/contexts/auth-context";
import { useTheme } from "../../shared/contexts/theme-context";
import { useLanguage } from "../../shared/contexts/language-context";
import SettingsModal from "../../shared/components/settings/settings-modal";
import { colorSchemesService } from "../../shared/services/theme/color-schemes/color-schemes.service";

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const { config } = useTheme();
  const { isRTL, t } = useLanguage();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t("common.loginFailed");
      setError(errorMessage);
    }
  };

  const fillTestCredentials = (testEmail: string, testPassword: string) => {
    setEmail(testEmail);
    setPassword(testPassword);
    setError("");
  };

  // Handle settings open
  const handleSettingsOpen = () => {
    setIsSettingsOpen(true);
  };

  // Handle settings close
  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
  };

  // Get current color scheme for dynamic styling
  const currentColorScheme = colorSchemesService.getColorScheme(
    config.colorScheme
  );
  const primaryColor = currentColorScheme.primary[600];
  const primaryHoverColor = currentColorScheme.primary[700];

  // Create dynamic gradient background based on theme colors
  const getBackgroundGradient = () => {
    const secondary900 = currentColorScheme.secondary[900];
    const primary700 = currentColorScheme.primary[700];
    const primary900 = currentColorScheme.primary[900];

    return `linear-gradient(to bottom right, ${secondary900}, ${primary700}, ${primary900})`;
  };

  const flexDirection = isRTL ? "flex-row" : "flex-row-reverse";
  const rtl = isRTL ? "rtl" : "ltr";
  return (
    <div
      dir={rtl}
      className={`min-h-screen flex overflow-hidden`}
      style={{
        height: "100vh",
        overflow: "hidden",
        background: getBackgroundGradient(),
      }}
    >
      {/* Left Section - Project Information */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-12 xl:px-16 py-8 lg:py-0 order-2 md:order-1">
        <div className="max-w-lg">
          {/* Logo/Brand */}
          <div className="mb-8">
            <div className="flex items-center gap-x-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(to right, ${currentColorScheme.primary[500]}, ${currentColorScheme.primary[600]})`,
                }}
              >
                <span className="text-white text-2xl font-bold">R</span>
              </div>
              <h1 className="text-3xl font-bold text-white">
                {t("app.title")}
              </h1>
            </div>
          </div>

          {/* Punch Line */}
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            {t("app.tagline")}
          </h2>

          {/* Description */}
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            {t("app.description")}
          </p>

          {/* Features */}
          <div className="space-y-4 mb-12">
            <div className="flex items-center gap-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-gray-300">
                {t("app.features.gpsTracking")}
              </span>
            </div>
            <div className="flex items-center gap-x-3 ">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-gray-300">
                {t("app.features.securePayments")}
              </span>
            </div>
            <div className="flex items-center gap-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-gray-300">
                {t("app.features.analytics")}
              </span>
            </div>
          </div>

          {/* Role Buttons */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              {t("common.quickAccessDemo")}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  fillTestCredentials("john.doe@example.com", "password123")
                }
                className="role-button text-white px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <div className="flex items-center gap-x-2">
                  <span className="text-lg">👤</span>
                  <span className="font-medium">{t("common.passenger")}</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() =>
                  fillTestCredentials("mike.wilson@example.com", "password123")
                }
                className="role-button text-white px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <div className="flex items-center gap-x-2">
                  <span className="text-lg">🚗</span>
                  <span className="font-medium">{t("common.driver")}</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() =>
                  fillTestCredentials("admin@uber.com", "password123")
                }
                className="role-button text-white px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <div className="flex items-center gap-x-2">
                  <span className="text-lg">⚙️</span>
                  <span className="font-medium">{t("common.admin")}</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() =>
                  fillTestCredentials("support@uber.com", "password123")
                }
                className="role-button text-white px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <div className="flex items-center gap-x-2">
                  <span className="text-lg">🛠️</span>
                  <span className="font-medium">
                    {t("common.supportManager")}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="flex-1 flex items-center justify-center px-8 lg:px-12 xl:px-16 py-8 lg:py-0 order-1 md:order-2">
        <div className="w-full max-w-md">
          <div className="login-form-3d backdrop-blur-xl border border-white/10 rounded-3xl p-12 min-h-[500px] shadow-2xl bg-white/10">
            {/* Form Header */}
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-3">
                {t("common.welcomeBack")}
              </h2>
              <p className="text-gray-300 text-lg">
                {t("common.signInToAccount")}
              </p>
            </div>

            {/* Login Form */}
            <form className="space-y-8" onSubmit={onSubmit}>
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-200 mb-3"
                  >
                    {t("common.email")}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("common.enterEmail")}
                    className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-200 mb-3"
                  >
                    {t("common.password")}
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("common.enterPassword")}
                    className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-200 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full text-white font-semibold py-4 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{
                  background: `linear-gradient(to right, ${currentColorScheme.primary[600]}, ${currentColorScheme.primary[700]})`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(to right, ${currentColorScheme.primary[500]}, ${currentColorScheme.primary[600]})`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `linear-gradient(to right, ${currentColorScheme.primary[600]}, ${currentColorScheme.primary[700]})`;
                }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {t("common.signingIn")}
                  </span>
                ) : (
                  <span>{t("common.signIn")}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={handleSettingsClose} />

      {/* Settings Floating Button */}
      <button
        onClick={handleSettingsOpen}
        className="fixed bottom-6 right-6 p-4 text-white rounded-full shadow-lg transition-colors duration-200 z-50"
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
    </div>
  );
};

export default LoginPage;
