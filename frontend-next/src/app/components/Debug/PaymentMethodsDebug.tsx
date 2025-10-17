import React from "react";

/**
 * Debug component for testing payment methods functionality
 */
export default function PaymentMethodsDebug() {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <h2 className="text-lg font-semibold text-yellow-800 mb-2">
        🔧 Payment Methods Debug Panel
      </h2>
      <p className="text-yellow-700">
        This is a debug component for testing payment methods functionality.
      </p>
      <div className="mt-2 text-sm text-yellow-600">
        <p>
          • Mock data enabled:{" "}
          {process.env.NODE_ENV === "development" ? "Yes" : "No"}
        </p>
        <p>• Environment: {process.env.NODE_ENV}</p>
      </div>
    </div>
  );
}
