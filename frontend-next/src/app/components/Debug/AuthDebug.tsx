import React, { useState } from "react";
import { authService as authApiService } from "../../../shared/services/auth.service";

export default function AuthDebug() {
  const [results, setResults] = useState<string[]>([]);
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("password123");

  const addResult = (result: string) => {
    setResults((prev) => [...prev, result]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testDirectLogin = async () => {
    try {
      addResult("🔍 Testing direct login API call...");
      const response = await authApiService.login(email, password);
      addResult(`✅ Login successful: ${JSON.stringify(response, null, 2)}`);

      // Store token manually for testing
      if (response.access_token) {
        localStorage.setItem("authToken", response.access_token);
        addResult(
          `🔑 Token stored: ${response.access_token.substring(0, 20)}...`
        );
      }
    } catch (error) {
      addResult(
        `❌ Login failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const testDirectProfile = async () => {
    try {
      addResult("👤 Testing direct profile API call...");
      const token = localStorage.getItem("authToken");
      addResult(
        `🔍 Current token: ${token ? token.substring(0, 20) + "..." : "None"}`
      );

      const userProfile = await authApiService.getProfile();
      addResult(
        `✅ Profile successful: ${JSON.stringify(userProfile, null, 2)}`
      );
    } catch (error) {
      addResult(
        `❌ Profile failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const testManualFetch = async () => {
    try {
      addResult("🔧 Testing manual fetch to profile endpoint...");
      const token = localStorage.getItem("authToken");

      const response = await fetch("http://localhost:3000/auth/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      addResult(
        `📡 Response status: ${response.status} ${response.statusText}`
      );

      if (response.ok) {
        const data = await response.json();
        addResult(
          `✅ Manual fetch successful: ${JSON.stringify(data, null, 2)}`
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        addResult(
          `❌ Manual fetch failed: ${JSON.stringify(errorData, null, 2)}`
        );
      }
    } catch (error) {
      addResult(
        `❌ Manual fetch error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const checkLocalStorage = () => {
    addResult("💾 Checking localStorage...");
    const token = localStorage.getItem("authToken");
    const isAuth = localStorage.getItem("isAuthenticated");
    const user = localStorage.getItem("user");

    addResult(`🔑 Token: ${token ? token.substring(0, 30) + "..." : "None"}`);
    addResult(`✅ IsAuthenticated: ${isAuth || "None"}`);
    addResult(`👤 User: ${user ? JSON.parse(user).email : "None"}`);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Tool</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={testDirectLogin}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Test Login
        </button>
        <button
          onClick={testDirectProfile}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Test Profile
        </button>
        <button
          onClick={testManualFetch}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
        >
          Manual Fetch
        </button>
        <button
          onClick={checkLocalStorage}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
        >
          Check Storage
        </button>
        <button
          onClick={clearResults}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          Clear
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Debug Results:</h2>
        <div className="space-y-1 font-mono text-sm max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-gray-500">
              Click buttons above to start debugging...
            </p>
          ) : (
            results.map((result, index) => (
              <div key={index} className="py-1 border-b border-gray-200">
                {result}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
