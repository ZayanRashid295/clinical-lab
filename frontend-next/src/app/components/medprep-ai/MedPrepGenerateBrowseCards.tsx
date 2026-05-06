"use client";

import {
  ArrowLeft,
  BarChart3,
  CheckCircle,
  FileText,
  Heart,
  Home,
  Layers,
  Lightbulb,
  Sparkles,
  Stethoscope,
  Hash,
  Activity,
  Star,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type MedPrepCaseChoiceTheme = "practice" | "learning" | "evaluation";

const GENERATE_FEATURES: {
  icon: typeof Stethoscope;
  label: string;
}[] = [
  {
    icon: Stethoscope,
    label: "Choose specialty (Cardiology, Neurology, etc.)",
  },
  {
    icon: BarChart3,
    label: "Set difficulty level (Beginner to Advanced)",
  },
  { icon: Heart, label: "Toggle rare disease cases" },
  {
    icon: Layers,
    label: "Select case type (Emergency, Outpatient, Chronic)",
  },
];

function browseFeatures(prebuiltCount: number) {
  return [
    {
      icon: Hash,
      label: `${prebuiltCount} pre-built cases`,
      iconClass: "text-violet-600",
    },
    {
      icon: Activity,
      label: "Multiple specialties covered",
      iconClass: "text-violet-600",
    },
    {
      icon: Star,
      label: "Various difficulty levels",
      iconClass: "text-amber-500",
    },
    {
      icon: Star,
      label: "Both common and rare diseases",
      iconClass: "text-rose-500",
    },
  ];
}

const themeStyles: Record<
  MedPrepCaseChoiceTheme,
  {
    pageBg: string;
    generateOrb: string;
    browseOrb: string;
    generateBtn: string;
    browseBtn: string;
  }
> = {
  practice: {
    pageBg: "bg-gradient-to-br from-blue-50 via-white to-purple-50",
    generateOrb: "from-purple-500 to-blue-600",
    browseOrb: "from-blue-500 to-green-600",
    generateBtn:
      "bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700",
    browseBtn:
      "bg-gradient-to-r from-blue-500 to-green-600 hover:from-blue-600 hover:to-green-700",
  },
  learning: {
    pageBg: "bg-gradient-to-br from-green-50 via-white to-teal-50",
    generateOrb: "from-green-500 to-teal-600",
    browseOrb: "from-teal-500 to-blue-600",
    generateBtn:
      "bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700",
    browseBtn:
      "bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700",
  },
  evaluation: {
    pageBg: "bg-gradient-to-br from-sky-50 via-white to-violet-50",
    generateOrb: "from-blue-500 to-purple-600",
    browseOrb: "from-violet-500 to-fuchsia-600",
    generateBtn:
      "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
    browseBtn:
      "bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700",
  },
};

export interface MedPrepGenerateBrowseCardsProps {
  theme: MedPrepCaseChoiceTheme;
  modeTitle: string;
  prebuiltCaseCount: number;
  onGenerateClick: () => void;
  onBrowseClick: () => void;
  onBackToMode: () => void;
}

/**
 * Shared “Generate New Case” / “Browse Cases” step (2×2 feature grids) after Start on each MedPrep mode.
 */
export function MedPrepGenerateBrowseCards({
  theme,
  modeTitle,
  prebuiltCaseCount,
  onGenerateClick,
  onBrowseClick,
  onBackToMode,
}: MedPrepGenerateBrowseCardsProps) {
  const t = themeStyles[theme];
  const browseItems = browseFeatures(prebuiltCaseCount);

  return (
    <div className={`min-h-screen ${t.pageBg}`}>
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Choose your case
          </h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Generate a new case or browse existing cases
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          {/* Generate New Case */}
          <Card
            className="hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-200/80 shadow-md"
            onClick={onGenerateClick}
          >
            <CardHeader className="text-center pb-2">
              <div
                className={`w-16 h-16 bg-gradient-to-r ${t.generateOrb} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-md`}
              >
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-gray-900">
                Generate New Case
              </CardTitle>
              <CardDescription className="text-gray-600 text-base">
                Create a personalized evaluation experience tailored to your
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-900">
                <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
                Customization Options:
              </div>
              <div className="grid grid-cols-2 gap-3">
                {GENERATE_FEATURES.map((f) => (
                  <div
                    key={f.label}
                    className="flex flex-col items-center text-center gap-2 rounded-lg border border-gray-100 bg-white/80 p-3 shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <f.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-xs text-gray-700 leading-snug">{f.label}</p>
                  </div>
                ))}
              </div>
              <Button
                className={`w-full text-white ${t.generateBtn}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onGenerateClick();
                }}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Case
              </Button>
            </CardContent>
          </Card>

          {/* Browse Cases */}
          <Card
            className="hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-200/80 shadow-md"
            onClick={onBrowseClick}
          >
            <CardHeader className="text-center pb-2">
              <div
                className={`w-16 h-16 bg-gradient-to-r ${t.browseOrb} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-md`}
              >
                <FileText className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-gray-900">Browse Cases</CardTitle>
              <CardDescription className="text-gray-600 text-base">
                Explore our comprehensive library of carefully curated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-900">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                Available Cases:
              </div>
              <div className="grid grid-cols-2 gap-3">
                {browseItems.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center text-center gap-2 rounded-lg border border-gray-100 bg-white/80 p-3 shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center">
                      <f.icon className={`h-5 w-5 ${f.iconClass}`} />
                    </div>
                    <p className="text-xs text-gray-700 leading-snug">{f.label}</p>
                  </div>
                ))}
              </div>
              <Button
                className={`w-full text-white ${t.browseBtn}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onBrowseClick();
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Browse Cases
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="outline"
            className="flex items-center gap-2 border-2 border-gray-600"
            onClick={onBackToMode}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {modeTitle}
          </Button>
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
