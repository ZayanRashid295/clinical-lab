"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { authService, useLanguage } from "../src/shared";

interface FormErrors {
  email?: string;
  password?: string;
}

const Login: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 3D mouse tracking properties
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const isAuth = authService.isAuthenticated();
    console.log("Login page - isAuthenticated:", isAuth);
    if (isAuth) {
      console.log("User is authenticated, redirecting to dashboard");
      router.push("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    // Check screen size for layout
    const checkScreenSize = () => {
      if (typeof window !== "undefined") {
        setIsDesktop(window.innerWidth >= 768);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email) {
      newErrors.email = t("common.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t("common.invalidEmail");
    }

    if (!password) {
      newErrors.password = t("common.passwordRequired");
    } else if (password.length < 6) {
      newErrors.password = t("common.passwordTooShort");
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getFieldError = (fieldName: string): string | null => {
    return formErrors[fieldName as keyof FormErrors] || null;
  };

  const onInputChange = (): void => {
    // Clear error when user starts typing
    if (error) {
      setError("");
    }

    // Clear field-specific errors
    setFormErrors({});
  };

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      setError(t("common.fillFieldsCorrectly"));
      return;
    }

    setIsLoading(true);
    setError("");

    console.log("🔐 Next.js login form submitted");
    console.log("📧 Email:", email);
    console.log("🔑 Password:", password ? "***" : "empty");

    try {
      await authService.login(email, password);
      console.log("✅ Next.js login successful, navigating to dashboard");
      router.push("/dashboard");
    } catch (err) {
      console.error("❌ Next.js login failed:", err);
      console.log("🔍 Error details:", {
        message: err instanceof Error ? err.message : String(err),
        type: typeof err,
        constructor: err?.constructor?.name,
      });

      const errorMessage =
        err instanceof Error ? err.message : t("common.loginFailed");
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestCredentials = (
    testEmail: string = "admin@example.com",
    testPassword: string = "password123"
  ): void => {
    console.log("🧪 Filling test credentials");
    setEmail(testEmail);
    setPassword(testPassword);
    setError("");
    setFormErrors({});
  };

  // 3D mouse tracking methods
  const onMouseMove = (event: React.MouseEvent): void => {
    // Get the entire page dimensions
    const pageWidth = window.innerWidth;
    const pageHeight = window.innerHeight;

    // Calculate mouse position relative to page center
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;

    const newMouseX = event.clientX - centerX;
    const newMouseY = event.clientY - centerY;

    setMouseX(newMouseX);
    setMouseY(newMouseY);

    // Calculate normalized mouse position (-1 to 1)
    const normalizedX = newMouseX / (pageWidth / 2);
    const normalizedY = newMouseY / (pageHeight / 2);

    // Calculate distance from center (0 to 1)
    const distanceFromCenter = Math.sqrt(
      normalizedX * normalizedX + normalizedY * normalizedY
    );

    // Apply minimum tilt when mouse is in center, maximum when at edges
    const minTilt = 2;
    const maxTilt = 15;
    const tiltIntensity = minTilt + distanceFromCenter * (maxTilt - minTilt);

    // Calculate rotation with smooth, continuous movement
    setRotateY(normalizedX * tiltIntensity);
    setRotateX(-normalizedY * tiltIntensity);
  };

  const onMouseLeave = (): void => {
    // Reset rotation when mouse leaves
    setRotateX(0);
    setRotateY(0);
  };

  const get3DTransform = (): string => {
    return `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
  };

  const getThemeGradient = (): string => {
    return "from-slate-900 via-purple-900 to-slate-900";
  };

  const getFormBackgroundGradient = (): string => {
    return "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)";
  };

  return (
    <>
      <Head>
        <title>Login - Clinical Portal</title>
        <meta
          name="description"
          content="Sign in to your clinical portal account"
        />
      </Head>

      <div
        className={`min-h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 ${
          isRTL ? "font-arabic" : "font-sans"
        }`}
        dir={isRTL ? "rtl" : "ltr"}
        lang={isRTL ? "ar" : "en"}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{
          background:
            "linear-gradient(to bottom right, var(--color-secondary-900), var(--color-primary-700), var(--color-primary-900))",
          display: "flex",
          flexDirection: isDesktop ? (isRTL ? "row-reverse" : "row") : "column",
        }}
      >
        {/* Left Section - Project Information */}
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-12 xl:px-16 py-8 lg:py-0 order-2 md:order-1">
          <div className="max-w-lg">
            {/* Logo/Brand */}
            <div className="mb-8">
              <div
                className={`flex items-center mb-4 ${
                  isRTL ? "space-x-reverse space-x-3" : "space-x-3"
                }`}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">R</span>
                </div>
                <h1
                  className={`text-3xl font-bold text-white ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {t("app.title")}
                </h1>
              </div>
            </div>

            {/* Punch Line */}
            <h2
              className={`text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight ${
                isRTL ? "text-right" : "text-left"
              }`}
            >
              {t("app.tagline")}
            </h2>

            {/* Description */}
            <p
              className={`text-xl text-gray-300 mb-8 leading-relaxed ${
                isRTL ? "text-right" : "text-left"
              }`}
            >
              {t("app.description")}
            </p>

            {/* Features */}
            <div className="space-y-4 mb-12">
              <div
                className={`flex items-center ${
                  isRTL ? "space-x-reverse space-x-3" : "space-x-3"
                }`}
              >
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span
                  className={`text-gray-300 ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {t("app.features.gpsTracking")}
                </span>
              </div>
              <div
                className={`flex items-center ${
                  isRTL ? "space-x-reverse space-x-3" : "space-x-3"
                }`}
              >
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span
                  className={`text-gray-300 ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {t("app.features.securePayments")}
                </span>
              </div>
              <div
                className={`flex items-center ${
                  isRTL ? "space-x-reverse space-x-3" : "space-x-3"
                }`}
              >
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span
                  className={`text-gray-300 ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {t("app.features.analytics")}
                </span>
              </div>
            </div>

            {/* Role Buttons */}
            <div className="space-y-4">
              <h3
                className={`text-lg font-semibold text-white mb-4 ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                {t("common.quickAccessDemo")}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    fillTestCredentials("john.doe@example.com", "password123")
                  }
                  className={`text-white py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center gap-3 ${
                    isRTL
                      ? "pl-12 pr-6 justify-end text-right"
                      : "pr-12 pl-6 justify-start text-left"
                  }`}
                >
                  <span className="text-lg">👤</span>
                  <span className="flex-1 font-medium">
                    {t("common.passenger")}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    fillTestCredentials(
                      "mike.wilson@example.com",
                      "password123"
                    )
                  }
                  className={`text-white py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center gap-3 ${
                    isRTL
                      ? "pl-12 pr-6 justify-end text-right"
                      : "pr-12 pl-6 justify-start text-left"
                  }`}
                >
                  <span className="text-lg">🚗</span>
                  <span className="flex-1 font-medium">
                    {t("common.driver")}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    fillTestCredentials("admin@uber.com", "password123")
                  }
                  className={`text-white py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center gap-3 ${
                    isRTL
                      ? "pl-12 pr-6 justify-end text-right"
                      : "pr-12 pl-6 justify-start text-left"
                  }`}
                >
                  <span className="text-lg">⚙️</span>
                  <span className="flex-1 font-medium">
                    {t("common.admin")}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    fillTestCredentials("support@uber.com", "password123")
                  }
                  className={`text-white py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center gap-3 ${
                    isRTL
                      ? "pl-12 pr-6 justify-end text-right"
                      : "pr-12 pl-6 justify-start text-left"
                  }`}
                >
                  <span className="text-lg">🛠️</span>
                  <span className="flex-1 font-medium">
                    {t("common.supportManager")}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - 3D Login Form */}
        <div className="flex-1 flex items-center justify-center px-8 lg:px-12 xl:px-16 py-8 lg:py-0 order-1 md:order-2">
          <div className="w-full max-w-md">
            {/* 3D Login Form Container */}
            <div
              className="login-form-3d backdrop-blur-xl border border-white/10 rounded-3xl p-12 min-h-[500px] shadow-2xl"
              style={{
                transform: get3DTransform(),
                background: getFormBackgroundGradient(),
              }}
            >
              {/* Form Header */}
              <div className={`mb-10 ${isRTL ? "text-right" : "text-center"}`}>
                <h2
                  className={`text-3xl font-bold text-white mb-3 ${
                    isRTL ? "text-right" : "text-center"
                  }`}
                >
                  {t("common.welcomeBack")}
                </h2>
                <p
                  className={`text-gray-300 text-lg ${
                    isRTL ? "text-right" : "text-center"
                  }`}
                >
                  {t("common.signInToAccount")}
                </p>
              </div>

              {/* Login Form */}
              <form className="space-y-8" onSubmit={onSubmit}>
                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="email"
                      className={`block text-sm font-medium text-gray-200 mb-3 ${
                        isRTL ? "text-right" : "text-left"
                      }`}
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
                      onChange={(e) => {
                        setEmail(e.target.value);
                        onInputChange();
                      }}
                      placeholder={t("common.enterEmail")}
                      className={`w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                        isRTL ? "text-right" : "text-left"
                      }`}
                      dir={isRTL ? "rtl" : "ltr"}
                    />
                    {getFieldError("email") && (
                      <p
                        className={`mt-2 text-sm text-red-400 ${
                          isRTL ? "text-right" : "text-left"
                        }`}
                      >
                        {getFieldError("email")}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className={`block text-sm font-medium text-gray-200 mb-3 ${
                        isRTL ? "text-right" : "text-left"
                      }`}
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
                      onChange={(e) => {
                        setPassword(e.target.value);
                        onInputChange();
                      }}
                      placeholder={t("common.enterPassword")}
                      className={`w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                        isRTL ? "text-right" : "text-left"
                      }`}
                      dir={isRTL ? "rtl" : "ltr"}
                    />
                    {getFieldError("password") && (
                      <p
                        className={`mt-2 text-sm text-red-400 ${
                          isRTL ? "text-right" : "text-left"
                        }`}
                      >
                        {getFieldError("password")}
                      </p>
                    )}
                  </div>
                </div>

                {error && (
                  <div
                    className={`bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-200 text-sm ${
                      isRTL ? "text-right" : "text-left"
                    }`}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-4 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {!isLoading ? (
                    <span>{t("common.signIn")}</span>
                  ) : (
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
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <style jsx>{`
          .font-arabic {
            font-family: "Cairo", "Noto Sans Arabic", "Tahoma", "Arial",
              sans-serif;
          }
        `}</style>
      </div>
    </>
  );
};

export default Login;
