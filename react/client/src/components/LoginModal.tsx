import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Stethoscope, Eye, EyeOff, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [, setLocation] = useLocation();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect theme mode
  useEffect(() => {
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setError("");
      setShowPassword(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      onClose();
      setLocation("/");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
    }
  };

  const fillTestCredentials = () => {
    setEmail("admin@uber.com");
    setPassword("password123");
    setError("");
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop with glassmorphic effect */}
      <div
        className={cn(
          "absolute inset-0 backdrop-blur-sm",
          isDarkMode ? "bg-black/20" : "bg-black/30"
        )}
      />

      {/* Modal content */}
      <div className="relative w-full max-w-md transform transition-all duration-300 ease-out">
        <div
          className={cn(
            "backdrop-blur-md border rounded-2xl shadow-2xl p-8",
            isDarkMode
              ? "bg-white/10 border-white/20"
              : "bg-black/20 border-black/30"
          )}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className={cn(
              "absolute top-4 right-4 h-8 w-8",
              isDarkMode
                ? "text-white/70 hover:text-white hover:bg-white/10"
                : "text-black/70 hover:text-black hover:bg-black/10"
            )}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div
                className={cn(
                  "h-12 w-12 rounded-lg backdrop-blur-sm flex items-center justify-center border",
                  isDarkMode
                    ? "bg-white/20 border-white/30"
                    : "bg-black/20 border-black/30"
                )}
              >
                <Stethoscope
                  className={cn(
                    "h-7 w-7",
                    isDarkMode ? "text-white" : "text-black"
                  )}
                />
              </div>
            </div>
            <h2
              className={cn(
                "text-2xl font-bold mb-2",
                isDarkMode ? "text-white" : "text-black"
              )}
            >
              Welcome Back
            </h2>
            <p className={cn(isDarkMode ? "text-white/80" : "text-black/80")}>
              Sign in to your Clinical Lab account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert
                variant="destructive"
                className={cn(
                  "border-red-500/30",
                  isDarkMode
                    ? "bg-red-500/20 text-white"
                    : "bg-red-500/20 text-black"
                )}
              >
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="modal-email"
                className={cn(isDarkMode ? "text-white/90" : "text-black/90")}
              >
                Email
              </Label>
              <Input
                id="modal-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className={cn(
                  "placeholder:text-white/50 focus:ring-white/20",
                  isDarkMode
                    ? "bg-white/10 border-white/20 text-white focus:border-white/40"
                    : "bg-black/10 border-black/20 text-black placeholder:text-black/50 focus:border-black/40 focus:ring-black/20"
                )}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="modal-password"
                className={cn(isDarkMode ? "text-white/90" : "text-black/90")}
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="modal-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className={cn(
                    "placeholder:text-white/50 focus:ring-white/20 pr-10",
                    isDarkMode
                      ? "bg-white/10 border-white/20 text-white focus:border-white/40"
                      : "bg-black/10 border-black/20 text-black placeholder:text-black/50 focus:border-black/40 focus:ring-black/20"
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "absolute right-0 top-0 h-full px-3 py-2",
                    isDarkMode
                      ? "hover:bg-white/10 text-white/70 hover:text-white"
                      : "hover:bg-black/10 text-black/70 hover:text-black"
                  )}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className={cn(
                "w-full transition-all duration-200",
                isDarkMode
                  ? "bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40"
                  : "bg-black/20 hover:bg-black/30 text-black border border-black/30 hover:border-black/40"
              )}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Test credentials button */}
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={fillTestCredentials}
              disabled={isLoading}
              className={cn(
                "text-sm bg-transparent",
                isDarkMode
                  ? "border-white/30 text-white hover:bg-white/10 hover:border-white/40"
                  : "border-black/30 text-black hover:bg-black/10 hover:border-black/40"
              )}
            >
              Fill Test Credentials
            </Button>
          </div>

          {/* Footer */}
          <div
            className={cn(
              "mt-6 text-center text-sm",
              isDarkMode ? "text-white/70" : "text-black/70"
            )}
          >
            <p>Don't have an account? Contact your administrator.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
