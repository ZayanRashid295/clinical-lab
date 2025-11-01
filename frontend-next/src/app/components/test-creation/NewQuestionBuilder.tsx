"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  MessageSquare,
  CheckCircle,
  UploadCloud,
  Trash2,
  Save,
} from "lucide-react";

// --- Types ---

interface Option {
  id: number;
  text: string;
  isCorrect: boolean;
  reason: string;
  comment: string;
}

interface ImageFile {
  id: number;
  name: string;
  size: string;
  url: string;
}

// --- Types and Interfaces ---

// --- Main Application Component ---

const initialOptions: Option[] = [
  {
    id: 0,
    text: "The nucleus contains the genetic material (DNA) and directs the synthesis of ribosomal RNA.",
    isCorrect: true,
    reason:
      "This is the main concept we are testing and it is fundamentally sound, encompassing both its structure and hereditary role.",
    comment: "Primary correct answer.",
  },
  {
    id: 1,
    text: "The function of the nucleus is primarily to generate ATP through oxidative phosphorylation.",
    isCorrect: false,
    reason:
      "This function is attributed to the mitochondria, not the nucleus. This option tests for confusion between major organelles.",
    comment: "Misconception 1 (Mitochondria confusion).",
  },
  {
    id: 2,
    text: "The nucleus is responsible for modifying, sorting, and packaging proteins for cell secretion.",
    isCorrect: false,
    reason:
      "This is the primary role of the Golgi apparatus, a common distractor based on general cell function.",
    comment: "Distractor based on keyword confusion (Golgi).",
  },
  {
    id: 3,
    text: "The nucleus aids in cell locomotion via pseudopods and microfilaments.",
    isCorrect: false,
    reason:
      "This refers to the cytoskeleton and cell membrane activities, not the nuclear function.",
    comment: "Low-difficulty distractor (Cytoskeleton).",
  },
  {
    id: 4,
    text: "The nucleus is the site for lipid synthesis and detoxification reactions.",
    isCorrect: false,
    reason:
      "This complex terminology belongs to the Smooth Endoplasmic Reticulum, incorrectly applied to the nucleus.",
    comment: "High-difficulty distractor (SER).",
  },
];

const App: React.FC = () => {
  // Keeping state for data visualization purposes
  const [questionText] = useState<string>(
    "What is the primary function of the nucleus in a eukaryotic cell, and which of the following options correctly describes its role in heredity?"
  );
  const [options] = useState<Option[]>(initialOptions);
  // Initial array is now empty, as requested.
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);

  // Mock function for image upload handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // In a real app, you would upload files to storage here.
    // For this demonstration, we create mock placeholder objects.
    const newPlaceholders: ImageFile[] = files.map((file, i) => ({
      id: Date.now() + i,
      name: file.name,
      size: (file.size / 1024).toFixed(2),
      // Mock URL for display
      url: `https://placehold.co/40x40/38bdf8/ffffff?text=Img+${
        imageFiles.length + i + 1
      }`,
    }));
    setImageFiles([...imageFiles, ...newPlaceholders]);
  };

  const removeImage = (id: number) => {
    setImageFiles(imageFiles.filter((img) => img.id !== id));
  };

  return (
    <div className="px-[50px] pb-[50px] pt-[25px] space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            New Question Builder
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and preview multiple choice questions with detailed
            explanations
          </p>
        </div>
        <Button
          onClick={() => {
            console.log("Finalizing question...");
            // TODO: Implement finalize question logic
          }}
        >
          <Save className="h-4 w-4 mr-2" />
          Finalize Question
        </Button>
      </div>

      {/* Question Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Question Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question Display */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Question:
            </h3>
            <p className="text-base leading-relaxed text-foreground">
              {questionText}
            </p>
          </div>

          {/* Image Preview Block is removed as requested */}

          {/* Options List Preview */}
          <div>
            <h4 className="text-base font-semibold mb-4">Answer Options:</h4>
            <ul className="space-y-4">
              {options.map((opt, index) => {
                const char = String.fromCharCode(65 + index);
                const reasonLabel = opt.isCorrect
                  ? "Correct Rationale"
                  : "Distractor Explanation";

                return (
                  <li
                    key={index}
                    className="border border-border p-4 rounded-lg"
                  >
                    <div className="flex items-start space-x-3">
                      <span className="font-bold text-lg text-primary w-8 flex-shrink-0">
                        {char}.
                      </span>
                      <p className="text-foreground font-medium flex-1">
                        {opt.text}
                      </p>
                      {opt.isCorrect && (
                        <Badge className="bg-green-100 text-green-800">
                          Correct
                        </Badge>
                      )}
                    </div>

                    {/* Rationale/Reason Block (Answer Key View) */}
                    <div
                      className={`mt-3 ml-8 p-3 rounded-lg border-l-4 ${
                        opt.isCorrect
                          ? "bg-green-50 border-green-400"
                          : "bg-red-50 border-red-400"
                      }`}
                    >
                      <p
                        className={`font-bold text-sm ${
                          opt.isCorrect ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {reasonLabel}:
                      </p>
                      <p className="text-sm mt-1 text-muted-foreground">
                        {opt.reason || "No rationale provided yet."}
                      </p>
                    </div>

                    {/* Internal Comment Block */}
                    {opt.comment && (
                      <div className="mt-2 ml-8 p-2 text-xs bg-muted rounded-lg flex items-center">
                        <MessageSquare
                          size={14}
                          className="mr-2 flex-shrink-0"
                        />
                        <span className="font-semibold">Internal Note:</span>{" "}
                        {opt.comment}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Image Upload Section */}
          <div className="pt-6 border-t">
            <h4 className="text-base font-semibold mb-3">
              Question Media Attachments
            </h4>
            <label
              htmlFor="image-upload"
              className="flex items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:bg-muted transition-colors"
            >
              <UploadCloud size={24} className="text-muted-foreground mr-3" />
              <span className="text-muted-foreground font-medium">
                Click to upload or drag & drop image(s)
              </span>
              <input
                type="file"
                id="image-upload"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {imageFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  Uploaded Files:
                </p>
                {imageFiles.map((img) => (
                  <div
                    key={img.id}
                    className="flex items-center justify-between p-3 bg-muted border border-border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={img.url}
                        alt={`Thumbnail of ${img.name}`}
                        className="w-10 h-10 rounded object-cover border border-border"
                        onError={(
                          e: React.SyntheticEvent<HTMLImageElement, Event>
                        ) => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            "https://placehold.co/40x40/ccc/000?text=File";
                        }}
                      />
                      <span className="text-sm font-medium text-foreground truncate">
                        {img.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({img.size} KB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeImage(img.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default App;
