import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { authService } from "../src/shared";
import { LoginForm, FormErrors } from "../src/app/types/core";

const Login = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginForm>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Check if user is already authenticated
  useEffect(() => {
    const isAuth = authService.isAuthenticated();
    console.log("Login page - isAuthenticated:", isAuth);
    if (isAuth) {
      console.log("User is authenticated, redirecting to dashboard");
      router.push("/dashboard");
    }
  }, [router]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (error) {
      setError("");
    }

    // Clear field-specific error
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setError("Please fill in all fields correctly.");
      return;
    }

    setIsLoading(true);
    setError("");

    console.log("🔐 Next.js login form submitted");
    console.log("📧 Email:", formData.email);
    console.log("🔑 Password:", formData.password ? "***" : "empty");

    try {
      await authService.login(formData.email, formData.password);
      console.log("✅ Next.js login successful, navigating to dashboard");
      router.push("/dashboard");
    } catch (err) {
      console.error("❌ Next.js login failed:", err);
      console.log("🔍 Error details:", {
        message: err instanceof Error ? err.message : String(err),
        type: typeof err,
        constructor: err?.constructor?.name,
        stack: err instanceof Error ? err.stack : undefined,
      });

      const errorMessage =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestCredentials = () => {
    console.log("🧪 Filling test credentials");
    setFormData({
      email: "test@example.com",
      password: "password123",
    });
    setError("");
    setErrors({});
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

      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 sm:space-y-8">
          <div className="text-center">
            <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Sign in to your account
            </p>
          </div>

          <form
            className="mt-6 sm:mt-8 space-y-5 sm:space-y-6"
            onSubmit={handleSubmit}
          >
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className={`mt-1 appearance-none relative block w-full px-3 py-3 sm:py-2 border ${
                    errors.email ? "border-red-300" : "border-gray-300"
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-base sm:text-sm`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className={`mt-1 appearance-none relative block w-full px-3 py-3 sm:py-2 border ${
                    errors.password ? "border-red-300" : "border-gray-300"
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-base sm:text-sm`}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-md p-3">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 sm:py-2 px-4 border border-transparent text-base sm:text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                Demo Users (all use password: password123):
              </p>
              <p className="text-xs text-blue-600 mb-3">
                🔄 Will try API first, then fallback to mock auth
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      email: "john.doe@example.com",
                      password: "password123",
                    });
                    setError("");
                    setErrors({});
                  }}
                  className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-2 sm:py-1 rounded border border-purple-300 transition-colors duration-200"
                >
                  Passenger
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      email: "mike.wilson@example.com",
                      password: "password123",
                    });
                    setError("");
                    setErrors({});
                  }}
                  className="bg-green-100 hover:bg-green-200 text-green-700 px-2 py-2 sm:py-1 rounded border border-green-300 transition-colors duration-200"
                >
                  Driver
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      email: "admin@uber.com",
                      password: "password123",
                    });
                    setError("");
                    setErrors({});
                  }}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-2 sm:py-1 rounded border border-blue-300 transition-colors duration-200"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      email: "support@uber.com",
                      password: "password123",
                    });
                    setError("");
                    setErrors({});
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-2 sm:py-1 rounded border border-gray-300 transition-colors duration-200"
                >
                  Support
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      email: "fleet@uber.com",
                      password: "password123",
                    });
                    setError("");
                    setErrors({});
                  }}
                  className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-2 py-2 sm:py-1 rounded border border-orange-300 transition-colors duration-200 sm:col-span-2"
                >
                  Fleet Manager
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
