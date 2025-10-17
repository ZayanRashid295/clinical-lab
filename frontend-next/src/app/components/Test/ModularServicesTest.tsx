import React, { useState } from "react";
import {
  rideHistoryService,
  authService,
  paymentsService,
  api,
} from "../../services";

// Test component to verify modular services work correctly
export default function ModularServicesTest() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults((prev) => [...prev, result]);
  };

  const testRidesService = async () => {
    try {
      addResult("Testing ride history service...");

      // Test individual service import
      const rides1 = await rideHistoryService.getList({ page: 1, limit: 5 });
      addResult("✅ rideHistoryService.getList() - Success");

      // Test api object import
      const rides2 = await api.rideHistory.getList({ page: 1, limit: 5 });
      addResult("✅ api.rideHistory.getList() - Success");

      // Test specific method
      const stats = await rideHistoryService.getStats();
      addResult("✅ rideHistoryService.getStats() - Success");
    } catch (error) {
      addResult(
        `❌ Rides service error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const testAuthService = async () => {
    try {
      addResult("Testing auth service...");

      // Test auth methods (will likely fail without proper credentials, but that's expected)
      const isAuth = authService.isAuthenticated();
      addResult(
        `✅ authService.isAuthenticated() - ${
          isAuth ? "Authenticated" : "Not authenticated"
        }`
      );

      const token = localStorage.getItem("authToken");
      addResult(
        `✅ authService token check - ${token ? "Token exists" : "No token"}`
      );
    } catch (error) {
      addResult(
        `❌ Auth service error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const testPaymentsService = async () => {
    try {
      addResult("Testing payments service...");

      // Test payments service
      const payments = await paymentsService.getPayments({ page: 1, limit: 5 });
      addResult("✅ paymentsService.getPayments() - Success");
    } catch (error) {
      addResult(
        `❌ Payments service error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    addResult("🚀 Starting modular services test...");

    await testAuthService();
    await testRidesService();
    await testPaymentsService();

    addResult("🏁 Test completed!");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Modular Services Test</h1>

      <div className="mb-6">
        <button
          onClick={runAllTests}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Run Tests
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Test Results:</h2>
        <div className="space-y-1 font-mono text-sm">
          {testResults.length === 0 ? (
            <p className="text-gray-500">
              Click &quot;Run Tests&quot; to start testing...
            </p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="py-1">
                {result}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <h3 className="font-semibold">What this tests:</h3>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>
            Individual service imports (ridesService, authService,
            paymentsService)
          </li>
          <li>Barrel exports from services/index.ts</li>
          <li>API object convenience exports (api.rides, api.auth, etc.)</li>
          <li>Service method calls and error handling</li>
          <li>TypeScript type checking</li>
        </ul>
      </div>
    </div>
  );
}
