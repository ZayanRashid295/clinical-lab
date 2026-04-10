import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Construction, ArrowLeft, Home } from "lucide-react";
import { MenuSystem, authService } from "../src/shared";
import { getMenuItemsForRole, MenuItem } from "../src/app/types/menu";
import { transportationContentRegistry } from "../src/app/config/content.registry";

export default function CatchAllPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  const { slug } = router.query;

  const findMenuItemByPath = useCallback(
    (items: MenuItem[], path: string): MenuItem | null => {
      for (const item of items) {
        if (item.path === path) {
          return item;
        }
        if (item.submenu) {
          const found = findMenuItemByPath(item.submenu, path);
          if (found) return found;
        }
      }
      return null;
    },
    []
  );

  useEffect(() => {
    // Check authentication status
    if (!authService.isAuthenticated()) {
      router.replace("/login");
      return;
    } else {
      setIsLoading(false);
    }

    // Try to find the menu item for this route
    if (slug) {
      const currentPath = `/${Array.isArray(slug) ? slug.join("/") : slug}`;
      const currentUser = authService.getCurrentUser();

      if (currentUser) {
        const menuItems = getMenuItemsForRole(currentUser.roles || []);
        const foundItem = findMenuItemByPath(menuItems, currentPath);
        setMenuItem(foundItem);

        // Also check if this path exists in the content registry
        console.log("Catch-all page checking path:", currentPath, {
          hasMenuItem: !!foundItem,
          hasContentRegistry:
            !!transportationContentRegistry.content[currentPath],
          availableContentPaths: Object.keys(
            transportationContentRegistry.content
          ).filter((p) => p.includes("chat")),
        });
      }
    }
  }, [router, slug, findMenuItemByPath]);

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

  const currentPath = slug
    ? `/${Array.isArray(slug) ? slug.join("/") : slug}`
    : "/";

  // Check if this path exists in the content registry
  const hasContentRegistry =
    !!transportationContentRegistry.content[currentPath];

  const pageTitle =
    menuItem?.label ||
    (hasContentRegistry ? "Content Available" : "Page Under Construction");
  const menuId =
    menuItem?.id || (hasContentRegistry ? currentPath : "under-construction");

  return (
    <>
      <Head>
        <title>{pageTitle} - Medical Lab</title>
        <meta
          name="description"
          content={`${pageTitle} page is under construction`}
        />
      </Head>

      <MenuSystem
        contentRegistry={transportationContentRegistry}
        applicationTitle="Medical Lab"
        customContent={
          menuId === "under-construction"
            ? {
                [menuId]: () => (
                  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center">
                      {/* Construction Icon */}
                      <div className="mx-auto flex items-center justify-center w-24 h-24 bg-yellow-100 rounded-full mb-8">
                        <Construction size={48} className="text-yellow-600" />
                      </div>

                      {/* Main Content */}
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        {pageTitle}
                      </h1>
                      <p className="text-xl text-gray-600 mb-8">
                        This page is currently under construction
                      </p>

                      {/* Page Info */}
                      <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left max-w-2xl mx-auto">
                        <h3 className="text-lg font-semibold text-blue-900 mb-3">
                          Page Information
                        </h3>
                        <div className="space-y-2 text-sm text-blue-800">
                          <div className="flex justify-between">
                            <span className="font-medium">Route:</span>
                            <span className="font-mono bg-blue-100 px-2 py-1 rounded">
                              {currentPath}
                            </span>
                          </div>
                          {menuItem && (
                            <>
                              <div className="flex justify-between">
                                <span className="font-medium">Menu Item:</span>
                                <span>{menuItem.label}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Icon:</span>
                                <span>{menuItem.icon}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Roles:</span>
                                <span>{menuItem.roles.join(", ")}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Coming Soon Features */}
                      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8 text-left max-w-2xl mx-auto">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Coming Soon
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Comprehensive data management interface
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Advanced filtering and search capabilities
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Real-time statistics and analytics
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Export and reporting functionality
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Mobile-responsive design
                          </li>
                        </ul>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                          onClick={() => router.back()}
                          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <ArrowLeft size={16} />
                          Go Back
                        </button>
                        <button
                          onClick={() => router.push("/dashboard")}
                          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <Home size={16} />
                          Go to Dashboard
                        </button>
                      </div>

                      {/* Additional Info */}
                      <div className="mt-12 text-sm text-gray-500">
                        <p>
                          This is a dynamic catch-all page that handles routes
                          defined in the menu configuration but not yet
                          implemented as specific pages.
                        </p>
                      </div>
                    </div>
                  </div>
                ),
              }
            : {}
        }
      />
    </>
  );
}
