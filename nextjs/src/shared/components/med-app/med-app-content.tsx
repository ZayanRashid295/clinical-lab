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
  Stethoscope,
  Heart,
  Brain,
  Activity,
  Users,
  BookOpen,
  Play,
  Pause,
  Volume2,
} from "lucide-react";

interface MedAppContentProps {
  isFullScreen?: boolean;
}

export default function MedAppContent({
  isFullScreen = false,
}: MedAppContentProps) {
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
              Medical Learning App
            </h1>
            <p className="text-muted-foreground mt-2">
              Interactive medical education and clinical training platform
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Learning Mode
            </Badge>
            <Button variant="outline" size="sm">
              <BookOpen className="h-4 w-4 mr-2" />
              Study Guide
            </Button>
          </div>
        </div>

        {/* Learning Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Heart className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Cardiology</CardTitle>
                  <CardDescription>
                    Heart conditions and treatments
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">75%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: "75%" }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>12/16 lessons</span>
                  <span>4.8★</span>
                </div>
                <Button className="w-full" size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Continue Learning
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Brain className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Neurology</CardTitle>
                  <CardDescription>Brain and nervous system</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">45%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: "45%" }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>7/15 lessons</span>
                  <span>4.6★</span>
                </div>
                <Button className="w-full" size="sm" variant="outline">
                  <Play className="h-4 w-4 mr-2" />
                  Start Learning
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Stethoscope className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Emergency Medicine</CardTitle>
                  <CardDescription>Critical care and trauma</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">90%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: "90%" }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>18/20 lessons</span>
                  <span>4.9★</span>
                </div>
                <Button className="w-full" size="sm" variant="outline">
                  <Play className="h-4 w-4 mr-2" />
                  Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Session */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Current Learning Session</span>
            </CardTitle>
            <CardDescription>
              Continue your medical education journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h4 className="font-medium text-primary mb-2">
                    Active Lesson
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    "Cardiac Arrhythmias: Diagnosis and Treatment"
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-muted-foreground">
                      Duration: 25:30
                    </span>
                    <span className="text-muted-foreground">
                      Remaining: 8:45
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Play
                  </Button>
                  <Button size="sm" variant="outline">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                  <Button size="sm" variant="outline">
                    <Volume2 className="h-4 w-4 mr-2" />
                    Volume
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Learning Objectives</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Identify common cardiac arrhythmias</li>
                    <li>• Understand diagnostic procedures</li>
                    <li>• Learn treatment protocols</li>
                    <li>• Practice case studies</li>
                  </ul>
                </div>

                <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                  <h4 className="font-medium text-green-600 mb-2">
                    Key Takeaway
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Atrial fibrillation is the most common sustained cardiac
                    arrhythmia, affecting 2-3% of the population.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Study Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">156</div>
              <p className="text-sm text-muted-foreground">Lessons Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">42h</div>
              <p className="text-sm text-muted-foreground">Study Time</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">87%</div>
              <p className="text-sm text-muted-foreground">Average Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">12</div>
              <p className="text-sm text-muted-foreground">Certificates</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
