"use client";

import React from "react";
import { useLanguage } from "../../shared/contexts/language-context";

const LanguageTestPage: React.FC = () => {
  const { isRTL, t, currentLocale } = useLanguage();

  return (
    <div
      className={`min-h-screen bg-gray-100 dark:bg-gray-900 p-8 ${
        isRTL ? "rtl" : "ltr"
      }`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className={`text-3xl font-bold text-gray-900 dark:text-white mb-2 ${
              isRTL ? "text-right" : "text-left"
            }`}
          >
            Language Test Page
          </h1>
          <p
            className={`text-gray-600 dark:text-gray-300 ${
              isRTL ? "text-right" : "text-left"
            }`}
          >
            Current Language: {currentLocale} | RTL: {isRTL ? "Yes" : "No"}
          </p>
        </div>

        {/* Test Sections */}
        <div className="space-y-8">
          {/* Simple Paragraph */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2
              className={`text-xl font-semibold mb-4 text-gray-900 dark:text-white ${
                isRTL ? "text-right" : "text-left"
              }`}
            >
              Simple Paragraph
            </h2>
            <p
              className={`text-gray-700 dark:text-gray-300 leading-relaxed ${
                isRTL ? "text-right" : "text-left"
              }`}
            >
              {t("app.description")}
            </p>
          </div>

          {/* Simple Button */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2
              className={`text-xl font-semibold mb-4 text-gray-900 dark:text-white ${
                isRTL ? "text-right" : "text-left"
              }`}
            >
              Simple Button
            </h2>
            <div
              className={`flex gap-4 ${
                isRTL ? "justify-end" : "justify-start"
              }`}
            >
              <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                {t("common.signIn")}
              </button>
              <button className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                {t("common.cancel")}
              </button>
            </div>
          </div>

          {/* Button with Icon and Text */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2
              className={`text-xl font-semibold mb-4 text-gray-900 dark:text-white ${"justify-start"}`}
            >
              Button with Icon and Text
            </h2>
            <div className="flex gap-4">
              <button
                style={{ width: "300px" }}
                className={`flex items-center gap-3 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors ${
                  isRTL ? "justify-end" : "justify-start"
                }`}
              >
                <span className="text-lg">💾</span>
                <span>{t("common.save")}</span>
              </button>

              <button
                style={{ width: "300px" }}
                className={`flex items-center gap-3 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors ${
                  isRTL ? "justify-end" : "justify-start"
                }`}
              >
                <span className="text-lg">🗑️</span>
                <span>{t("common.delete")}</span>
              </button>
            </div>
          </div>

          {/* List with Icons */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2
              className={`text-xl font-semibold mb-4 text-gray-900 dark:text-white ${
                isRTL ? "text-right" : "text-left"
              }`}
            >
              List with Icons
            </h2>
            <div className="space-y-3">
              <div
                className={`flex items-center gap-3 ${
                  isRTL ? "justify-end" : "justify-start"
                }`}
              >
                <span className="text-blue-500 text-lg">📍</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {t("app.features.gpsTracking")}
                </span>
              </div>

              <div
                className={`flex items-center gap-3 ${
                  isRTL ? "justify-end" : "justify-start"
                }`}
              >
                <span className="text-green-500 text-lg">💳</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {t("app.features.securePayments")}
                </span>
              </div>

              <div
                className={`flex items-center gap-3 ${
                  isRTL ? "justify-end" : "justify-start"
                }`}
              >
                <span className="text-purple-500 text-lg">📊</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {t("app.features.analytics")}
                </span>
              </div>
            </div>
          </div>

          {/* Form Elements */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2
              className={`text-xl font-semibold mb-4 text-gray-900 dark:text-white ${
                isRTL ? "text-right" : "text-left"
              }`}
            >
              Form Elements
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("common.email")}
                </label>
                <input
                  type="email"
                  placeholder={t("common.enterEmail")}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("common.password")}
                </label>
                <input
                  type="password"
                  placeholder={t("common.enterPassword")}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2
              className={`text-xl font-semibold mb-4 text-gray-900 dark:text-white ${
                isRTL ? "text-right" : "text-left"
              }`}
            >
              Navigation Menu
            </h2>
            <nav
              className={`flex gap-4 ${
                isRTL ? "justify-end" : "justify-start"
              }`}
            >
              <a
                href="#"
                className={`flex items-center gap-3 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors ${
                  isRTL ? "justify-end" : "justify-start"
                }`}
              >
                <span className="text-lg">🏠</span>
                <span>{t("common.dashboard")}</span>
              </a>

              <a
                href="#"
                className={`flex items-center gap-3 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors ${
                  isRTL ? "justify-end" : "justify-start"
                }`}
              >
                <span className="text-lg">⚙️</span>
                <span>{t("common.settings")}</span>
              </a>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageTestPage;
