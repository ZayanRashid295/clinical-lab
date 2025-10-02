import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TestLogout() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [testToken, setTestToken] = useState("");

  const handleSetTestToken = () => {
    const token = testToken || "test-token-123";
    localStorage.setItem("access_token", token);
    console.log("🔑 Token set:", token);
    window.location.reload();
  };

  const handleLogout = async () => {
    console.log("🧪 Test: Starting logout...");
    await logout();
    // Redirect to main page after logout
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Logout Test Page</CardTitle>
          <CardDescription>
            Test the logout functionality and see console logs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Set Test Token:</label>
            <input
              type="text"
              value={testToken}
              onChange={(e) => setTestToken(e.target.value)}
              placeholder="Enter test token"
              className="w-full p-2 border rounded"
            />
            <Button onClick={handleSetTestToken} className="w-full">
              Set Token
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm">
              <strong>User:</strong> {user ? JSON.stringify(user) : "null"}
            </p>
            <p className="text-sm">
              <strong>Authenticated:</strong> {isAuthenticated() ? "Yes" : "No"}
            </p>
            <p className="text-sm">
              <strong>Token:</strong>{" "}
              {localStorage.getItem("access_token") ? "Exists" : "None"}
            </p>
            <p className="text-sm">
              <strong>Loading:</strong> {isLoading ? "Yes" : "No"}
            </p>
          </div>

          <Button
            onClick={handleLogout}
            disabled={isLoading}
            className="w-full"
            variant="destructive"
          >
            {isLoading ? "Logging out..." : "Test Logout"}
          </Button>

          <div className="text-xs text-gray-500">
            <p>Open browser console to see detailed logs</p>
            <p>Check Network tab for API calls</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
