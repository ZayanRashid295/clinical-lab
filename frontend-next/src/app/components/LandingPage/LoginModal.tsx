"use client";

import { useState, useEffect } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Stethoscope, Eye, EyeOff, X } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { authService } from "@/shared/services/auth.service";
import { useRouter } from "next/router";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingPackageId?: string | null;
}

export function LoginModal({ isOpen, onClose, pendingPackageId }: LoginModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);

    try {
      // Use the auth service directly
      await authService.login(email, password);

      // Close modal first
      onClose();
      
      // Small delay to ensure modal closes before navigation
      setTimeout(() => {
        if (pendingPackageId) {
          // Redirect to checkout with the selected package
          router.push(`/checkout-basic?packageId=${pendingPackageId}`);
        } else {
          // Redirect to landing page on successful login
          router.push("/landing-page");
        }
      }, 100);
    } catch (err) {
      // Handle login errors
      const errorMessage =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
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
      <div className="absolute inset-0 backdrop-blur-sm bg-black/30" />

      {/* Modal content */}
      <div className="relative w-full max-w-md transform transition-all duration-300 ease-out">
        <div className="backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8 bg-white/10">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-lg backdrop-blur-sm flex items-center justify-center border bg-white/20 border-white/30">
                <Stethoscope className="h-7 w-7 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-white">Welcome Back</h2>
            <p className="text-white/70">
              Sign in to your Clinical Lab account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert
                variant="destructive"
                className="border-red-500/30 bg-red-500/20 text-white"
              >
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="modal-email" className="text-white/90">
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
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal-password" className="text-white/90">
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
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-white/10 text-white/70 hover:text-white"
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
              className="w-full transition-all duration-200 bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40"
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
              className="text-sm bg-transparent border-white/30 text-white hover:bg-white/10 hover:border-white/40"
            >
              Fill Test Credentials
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-white/70">
            <p>Don&apos;t have an account? Contact your administrator.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
