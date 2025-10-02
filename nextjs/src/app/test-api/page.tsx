"use client";

import React, { useState } from "react";
import { apiService } from "../../shared/services/api.service";

const TestApiPage: React.FC = () => {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult("Testing login API...");

    try {
      const response = await apiService.login({
        email: "test@example.com",
        password: "password123",
      });
      setResult(`✅ Login successful: ${JSON.stringify(response, null, 2)}`);
    } catch (error: any) {
      setResult(
        `❌ Login failed: ${error.message || JSON.stringify(error, null, 2)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const testProfile = async () => {
    setLoading(true);
    setResult("Testing profile API...");

    try {
      const response = await apiService.getProfile();
      setResult(`✅ Profile successful: ${JSON.stringify(response, null, 2)}`);
    } catch (error: any) {
      setResult(
        `❌ Profile failed: ${error.message || JSON.stringify(error, null, 2)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const testUsers = async () => {
    setLoading(true);
    setResult("Testing users API...");

    try {
      const response = await apiService.getUsers();
      setResult(`✅ Users successful: ${JSON.stringify(response, null, 2)}`);
    } catch (error: any) {
      setResult(
        `❌ Users failed: ${error.message || JSON.stringify(error, null, 2)}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          API Integration Test
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Environment Configuration
          </h2>
          <div className="space-y-2 text-sm">
            <p>
              <strong>API URL:</strong>{" "}
              {process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}
            </p>
            <p>
              <strong>Node ENV:</strong> {process.env.NODE_ENV}
            </p>
            <p>
              <strong>Use Real API:</strong>{" "}
              {process.env.NEXT_PUBLIC_USE_REAL_API}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API Tests</h2>
          <div className="space-x-4">
            <button
              onClick={testLogin}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              Test Login API
            </button>
            <button
              onClick={testProfile}
              disabled={loading}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              Test Profile API
            </button>
            <button
              onClick={testUsers}
              disabled={loading}
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              Test Users API
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="bg-gray-100 p-4 rounded">
            <pre className="whitespace-pre-wrap text-sm">
              {loading
                ? "Loading..."
                : result || "Click a test button to see results"}
            </pre>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Instructions
          </h3>
          <ul className="text-blue-800 space-y-1">
            <li>
              • <strong>Test Login API:</strong> Tests the login endpoint
              (expects 401 for invalid credentials)
            </li>
            <li>
              • <strong>Test Profile API:</strong> Tests the profile endpoint
              (expects 401 without auth token)
            </li>
            <li>
              • <strong>Test Users API:</strong> Tests the users endpoint
              (expects 401 without auth token)
            </li>
            <li>• Check the browser console for detailed API logs</li>
            <li>• Check the Network tab to see actual HTTP requests</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestApiPage;
