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
  Car,
  MapPin,
  Clock,
  User,
  Phone,
  Star,
  Filter,
  Search,
} from "lucide-react";

interface RidesContentProps {
  isFullScreen?: boolean;
}

export default function RidesContent({
  isFullScreen = false,
}: RidesContentProps) {
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
            <h1 className="text-3xl font-bold text-foreground">
              Rides Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Monitor and manage all ride requests and active rides
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Active Rides</span>
              </div>
              <div className="text-2xl font-bold mt-2">24</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium">Pending</span>
              </div>
              <div className="text-2xl font-bold mt-2">8</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">Completed</span>
              </div>
              <div className="text-2xl font-bold mt-2">1,247</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium">Cancelled</span>
              </div>
              <div className="text-2xl font-bold mt-2">12</div>
            </CardContent>
          </Card>
        </div>

        {/* Rides List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Rides</CardTitle>
            <CardDescription>
              Latest ride requests and active rides
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  id: "R001",
                  passenger: "Sarah Johnson",
                  driver: "Mike Chen",
                  pickup: "Central Park, NYC",
                  destination: "JFK Airport",
                  status: "active",
                  rating: 4.8,
                  phone: "+1 (555) 123-4567",
                },
                {
                  id: "R002",
                  passenger: "David Wilson",
                  driver: "Anna Rodriguez",
                  pickup: "Times Square",
                  destination: "Brooklyn Bridge",
                  status: "pending",
                  rating: 4.9,
                  phone: "+1 (555) 987-6543",
                },
                {
                  id: "R003",
                  passenger: "Emily Davis",
                  driver: "James Brown",
                  pickup: "Manhattan Mall",
                  destination: "LaGuardia Airport",
                  status: "completed",
                  rating: 4.7,
                  phone: "+1 (555) 456-7890",
                },
              ].map((ride, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Badge
                        variant={
                          ride.status === "active"
                            ? "default"
                            : ride.status === "pending"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {ride.status}
                      </Badge>
                      <span className="font-medium text-foreground">
                        #{ride.id}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">{ride.rating}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          Passenger: {ride.passenger}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          Driver: {ride.driver}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {ride.phone}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-muted-foreground">
                          From: {ride.pickup}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-muted-foreground">
                          To: {ride.destination}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          2:30 PM
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-3 space-x-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      Contact
                    </Button>
                    {ride.status === "pending" && (
                      <Button size="sm">Assign Driver</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
