import React, { ComponentType } from "react";
import { ContentConfig } from "../../../app/types/dashboard";
import DashboardRenderer from "../Dashboard/DashboardRenderer";

interface ContentRendererProps {
  path: string;
  contentConfig: ContentConfig;
  dashboards?: { [key: string]: any };
  customContent?: { [key: string]: ComponentType<any> };
  defaultContent?: ComponentType<any>;
  children?: React.ReactNode;
}

const normalizePath = (p: string) =>
  p.split("?")[0]?.split("#")[0] || "/";

const ContentRenderer: React.FC<ContentRendererProps> = ({
  path,
  contentConfig,
  dashboards = {},
  customContent = {},
  defaultContent,
  children,
}) => {
  const cleanPath = normalizePath(path);

  // Check for custom content first
  if (customContent[cleanPath]) {
    const CustomComponent = customContent[cleanPath];
    return <CustomComponent />;
  }

  // Check for dashboard content
  if (dashboards[cleanPath]) {
    return <DashboardRenderer config={dashboards[cleanPath]} />;
  }

  // Check for configured content
  const getContentForPath = (rawPath: string): React.ReactNode => {
    const currentPath = normalizePath(rawPath);
    const content = contentConfig[currentPath];

    if (!content) {
      // Try to find a partial match for nested paths
      const pathSegments = currentPath.split("/").filter(Boolean);
      for (let i = pathSegments.length; i > 0; i--) {
        const partialPath = "/" + pathSegments.slice(0, i).join("/");
        if (contentConfig[partialPath]) {
          return getContentForPath(partialPath);
        }
      }

      // Return default content or placeholder
      if (defaultContent) {
        const DefaultComponent = defaultContent;
        return <DefaultComponent />;
      }

      return (
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Content Not Found
          </h2>
          <p className="text-gray-600">
            No content configured for path: {currentPath}
          </p>
          {children}
        </div>
      );
    }

    // If content is a React component
    if (typeof content === "function" || (content as any).$$typeof) {
      const Component = content as ComponentType<any>;
      return <Component />;
    }

    // If content is a nested config object
    if (typeof content === "object" && !React.isValidElement(content)) {
      const nestedConfig = content as ContentConfig;
      // For nested configs, we might want to render a sub-navigation or different layout
      return (
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Section: {currentPath}
          </h2>
          <p className="text-gray-600">
            This section contains multiple sub-sections. Please configure
            specific content for each sub-path.
          </p>
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Available sub-sections:
            </h3>
            <ul className="list-disc list-inside text-gray-600">
              {Object.keys(nestedConfig).map((key) => (
                <li key={key}>
                  {currentPath}
                  {key}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    // If content is a React element
    if (React.isValidElement(content)) {
      return content;
    }

    // Fallback
    return (
      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Invalid Content Configuration
        </h2>
        <p className="text-gray-600">
          Content for path &quot;{currentPath}&quot; is not properly configured.
        </p>
      </div>
    );
  };

  return <>{getContentForPath(cleanPath)}</>;
};

export default ContentRenderer;
