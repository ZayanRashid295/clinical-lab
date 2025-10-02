"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../shared/contexts/auth-context";
import { useTheme } from "../../shared/contexts/theme-context";
import { useRouter } from "next/navigation";
import MenuSystem from "../../shared/components/menu-system/menu-system";

const DashboardPage: React.FC = () => {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const { config } = useTheme();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Ensure client-side rendering to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !isAuthenticated && !isLoading) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router, isClient]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Show loading state during SSR and initial client load
  if (!isClient || isLoading || (!isAuthenticated && isClient)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <MenuSystem
      applicationTitle="Ride Sharing App"
      enableSearch={true}
      searchPlaceholder="Search..."
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Welcome back, {user?.name}!
          </p>
        </div>

        {/* Dashboard Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <i className="fas fa-car text-blue-600 dark:text-blue-400 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Rides
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  1,234
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <i className="fas fa-dollar-sign text-green-600 dark:text-green-400 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Revenue
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  $12,345
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
                <i className="fas fa-users text-yellow-600 dark:text-yellow-400 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Users
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  567
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                <i className="fas fa-chart-line text-purple-600 dark:text-purple-400 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Growth
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  +12.5%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      New ride completed
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      2 minutes ago
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      Driver assigned to ride
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      5 minutes ago
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      Payment processed
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      10 minutes ago
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                User Information
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Email
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {user?.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Roles
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {user?.roles?.join(", ")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Current Theme
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {config.theme} | {config.colorScheme}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MenuSystem>
  );
};

export default DashboardPage;
