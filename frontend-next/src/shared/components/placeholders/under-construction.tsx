"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  Construction,
  Wrench,
  Hammer,
  Cog,
  Lightbulb,
  Rocket,
  Calendar,
  Users,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface UnderConstructionProps {
  menuTitle: string;
  menuIcon?: string;
  description?: string;
  estimatedCompletion?: string;
  features?: string[];
  isFullScreen?: boolean;
}

export default function UnderConstruction({
  menuTitle,
  menuIcon = "🚧",
  description,
  estimatedCompletion,
  features = [],
  isFullScreen = false,
}: UnderConstructionProps) {
  const containerClass = isFullScreen
    ? "min-h-screen bg-background p-6"
    : "p-6";

  const maxWidthClass = isFullScreen
    ? "max-w-7xl mx-auto space-y-6"
    : "space-y-6";

  const defaultFeatures = [
    "Advanced analytics and reporting",
    "Real-time data synchronization",
    "User-friendly interface design",
    "Mobile-responsive layout",
    "Integration with existing systems",
  ];

  const displayFeatures = features.length > 0 ? features : defaultFeatures;

  return (
    <div className={containerClass}>
      <div className={maxWidthClass}>
        {/* Header Section */}
        <div className="text-center space-y-6 py-12">
          <div className="relative">
            <div className="text-8xl mb-4 animate-pulse">{menuIcon}</div>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="h-6 w-6 text-yellow-500 animate-spin" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground">{menuTitle}</h1>
            <Badge
              variant="secondary"
              className="bg-orange-500/10 text-orange-600 border-orange-500/20"
            >
              <Construction className="h-3 w-3 mr-1" />
              Under Construction
            </Badge>
          </div>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {description ||
              `We're working hard to bring you an amazing ${menuTitle.toLowerCase()} experience. This feature is currently under development and will be available soon.`}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Construction Status */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hammer className="h-5 w-5 text-orange-500" />
                Development Status
              </CardTitle>
              <CardDescription>
                Current progress and upcoming features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Overall Progress
                  </span>
                  <span className="font-medium">65%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-yellow-500 h-3 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: "65%" }}
                  ></div>
                </div>
              </div>

              {/* Development Phases */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">
                  Development Phases
                </h4>
                <div className="space-y-3">
                  {[
                    {
                      phase: "Planning & Design",
                      status: "completed",
                      progress: 100,
                    },
                    {
                      phase: "Core Development",
                      status: "in-progress",
                      progress: 75,
                    },
                    { phase: "Testing & QA", status: "pending", progress: 0 },
                    { phase: "Deployment", status: "pending", progress: 0 },
                  ].map((phase, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          phase.status === "completed"
                            ? "bg-green-500"
                            : phase.status === "in-progress"
                            ? "bg-orange-500"
                            : "bg-muted"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-foreground">
                            {phase.phase}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {phase.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1 mt-1">
                          <div
                            className="bg-gradient-to-r from-green-500 to-orange-500 h-1 rounded-full transition-all duration-500"
                            style={{ width: `${phase.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline & Features */}
          <div className="space-y-6">
            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Development Started
                      </p>
                      <p className="text-xs text-muted-foreground">
                        2 weeks ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Current Phase
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Core Development
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Expected Launch
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {estimatedCompletion || "End of next month"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  Development Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">JD</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        John Developer
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Lead Developer
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">SD</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Sarah Designer
                      </p>
                      <p className="text-xs text-muted-foreground">
                        UI/UX Designer
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">QT</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Quality Tester
                      </p>
                      <p className="text-xs text-muted-foreground">
                        QA Engineer
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Coming Features
            </CardTitle>
            <CardDescription>
              Exciting features we're working on for {menuTitle}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <Rocket className="h-12 w-12 text-blue-500 mx-auto" />
              <h3 className="text-2xl font-bold text-foreground">
                Stay Updated
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Want to be notified when this feature is ready? We'll keep you
                posted on our progress.
              </p>
              <div className="flex justify-center space-x-3">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                  <Cog className="h-4 w-4 mr-2" />
                  Get Notified
                </Button>
                <Button variant="outline">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Learn More
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
