"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Users,
  Car,
  DollarSign,
  TrendingUp,
  Activity,
  Clock,
  Star,
} from "lucide-react";

interface DashboardContentProps {
  isFullScreen?: boolean;
}

export default function DashboardContent({
  isFullScreen = false,
}: DashboardContentProps) {
  const containerClass = isFullScreen
    ? "min-h-screen bg-background p-6"
    : "p-6";

  const maxWidthClass = isFullScreen
    ? "max-w-7xl mx-auto space-y-6"
    : "space-y-6";

  return (
    <div className={containerClass}>
      <div className={maxWidthClass}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome to your ride-sharing management dashboard
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-green-500/10 text-green-600"
            >
              System Online
            </Badge>
            <Button variant="outline" size="sm">
              <Activity className="h-4 w-4 mr-2" />
              Live Updates
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,847</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Drivers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +8% from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,231</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +23% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.8</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +0.2 from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest rides and system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    type: "ride",
                    message: "New ride completed: Downtown to Airport",
                    time: "2 minutes ago",
                    status: "completed",
                  },
                  {
                    type: "driver",
                    message: "Driver John Smith went online",
                    time: "5 minutes ago",
                    status: "online",
                  },
                  {
                    type: "payment",
                    message: "Payment processed: $24.50",
                    time: "8 minutes ago",
                    status: "success",
                  },
                  {
                    type: "ride",
                    message: "Ride request: Central Park to Times Square",
                    time: "12 minutes ago",
                    status: "pending",
                  },
                ].map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-4 p-3 border rounded-lg"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.status === "completed"
                          ? "bg-green-500"
                          : activity.status === "online"
                          ? "bg-blue-500"
                          : activity.status === "success"
                          ? "bg-green-500"
                          : "bg-yellow-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {activity.message}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Car className="h-4 w-4 mr-2" />
                View All Rides
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Manage Drivers
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <DollarSign className="h-4 w-4 mr-2" />
                Payment Reports
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>
              Key metrics and trends for the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  98.5%
                </div>
                <p className="text-sm text-muted-foreground">Uptime</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  4.2 min
                </div>
                <p className="text-sm text-muted-foreground">Avg Wait Time</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  15.7 km
                </div>
                <p className="text-sm text-muted-foreground">
                  Avg Trip Distance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
