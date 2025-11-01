import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MenuSystem, authService } from "../src/shared";
import UserManagementContent from "../src/app/components/Content/UserManagementContent";
import RoleManagementContent from "../src/app/components/Content/RoleManagementContent";
import SystemSettingsContent from "../src/app/components/Content/SystemSettingsContent";
import ReportsContent from "../src/app/components/Content/ReportsContent";
import AuditLogsContent from "../src/app/components/Content/AuditLogsContent";
import SubscriptionManagementContent from "../src/app/components/Content/SubscriptionManagementContent";
import SubscriptionPackageManagementContent from "../src/app/components/Content/SubscriptionPackageManagementContent";
import PackageFeatureManagementContent from "../src/app/components/Content/PackageFeatureManagementContent";
import ProductManagementContent from "../src/app/components/Content/ProductManagementContent";
import ProductTagManagementContent from "../src/app/components/Content/ProductTagManagementContent";
import ProductSubtypeManagementContent from "../src/app/components/Content/ProductSubtypeManagementContent";
import SectionManagementContent from "../src/app/components/Content/SectionManagementContent";
import ChapterManagementContent from "../src/app/components/Content/ChapterManagementContent";
import TopicManagementContent from "../src/app/components/Content/TopicManagementContent";
import { transportationContentRegistry } from "../src/app/config/content.registry";

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Create stable customContent object
  const customContent = useMemo(() => {
    const content = {
      admin: () => (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Administration Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Manage system administration and configuration
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-lg">👥</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold text-gray-900">184</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-lg">🔐</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">
                    Active Roles
                  </p>
                  <p className="text-2xl font-bold text-gray-900">5</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-lg">📊</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Reports</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 text-lg">📝</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">
                    Audit Logs
                  </p>
                  <p className="text-2xl font-bold text-gray-900">2,847</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-xl">👥</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    User Management
                  </h3>
                  <p className="text-sm text-gray-600">
                    Manage system users and permissions
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-xl">🔐</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Role Management
                  </h3>
                  <p className="text-sm text-gray-600">
                    Define and manage user roles
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-xl">⚙️</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    System Settings
                  </h3>
                  <p className="text-sm text-gray-600">
                    Configure system-wide settings
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 text-xl">📊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Reports
                  </h3>
                  <p className="text-sm text-gray-600">
                    Generate and manage reports
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 text-xl">📝</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Audit Logs
                  </h3>
                  <p className="text-sm text-gray-600">
                    Monitor system activities
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-600">
                  John Smith created a new user account
                </span>
                <span className="text-gray-400 ml-auto">2 hours ago</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-gray-600">
                  System backup completed successfully
                </span>
                <span className="text-gray-400 ml-auto">4 hours ago</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-gray-600">
                  Failed login attempt detected
                </span>
                <span className="text-gray-400 ml-auto">6 hours ago</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-gray-600">
                  Monthly revenue report generated
                </span>
                <span className="text-gray-400 ml-auto">1 day ago</span>
              </div>
            </div>
          </div>
        </div>
      ),
      users: () => <UserManagementContent />,
      roles: () => <RoleManagementContent />,
      "system-settings": () => <SystemSettingsContent />,
      reports: () => <ReportsContent />,
      "audit-logs": () => <AuditLogsContent />,
      subscriptions: () => <SubscriptionManagementContent />,
      "subscriptions-list": () => <SubscriptionManagementContent />,
      "subscription-packages": () => <SubscriptionPackageManagementContent />,
      "package-features": () => <PackageFeatureManagementContent />,
      products: () => <ProductManagementContent />,
      "products-list": () => <ProductManagementContent />,
      "product-tags": () => <ProductTagManagementContent />,
      "product-subtypes": () => <ProductSubtypeManagementContent />,
      content: () => <SectionManagementContent />,
      sections: () => <SectionManagementContent />,
      chapters: () => <ChapterManagementContent />,
      topics: () => <TopicManagementContent />,
    };
    return content;
  }, []);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.replace("/login");
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Administration - Medical Lab</title>
        <meta
          name="description"
          content="System administration and management"
        />
      </Head>

      <MenuSystem
        applicationTitle="Medical Lab"
        searchPlaceholder="Search administration..."
        enableSearch={true}
        customContent={customContent}
        contentRegistry={transportationContentRegistry}
      />
    </>
  );
}
