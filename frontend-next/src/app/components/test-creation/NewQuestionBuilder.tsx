"use client";

import React, { useState } from "react";
import {
  Radio,
  Image,
  MessageSquare,
  CheckCircle,
  XCircle,
  ChevronRight,
  UploadCloud,
  ChevronLeft,
  Trash2,
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

interface ActionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

// --- Utility Components (Kept for dependencies/styling) ---

// A simple button for tab navigation or actions
const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  onClick,
  className = "",
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${className}`}
  >
    {children}
  </button>
);

// LabeledInput and OptionEditor components are now unused but kept to maintain the structure of the original data model.

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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-inter">
      <h1 className="text-3xl font-extrabold text-green-700 mb-6 border-b-4 border-green-200 pb-2">
        MCQ Question Preview Only
      </h1>

      <div className="w-full">
        {/* Full-Width Preview Column */}
        <div className="w-full">
          <div className="sticky top-8 bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center">
              <span className="p-2 bg-green-100 rounded-full mr-3">
                <CheckCircle size={24} className="text-green-600" />
              </span>
              Final Question Layout
            </h2>

            {/* Question Display */}
            <div className="text-lg font-semibold text-gray-900 mb-4">
              {questionText}
            </div>

            {/* Image Preview Block is removed as requested */}

            {/* Options List Preview */}
            <ul className="space-y-4">
              {options.map((opt, index) => {
                const char = String.fromCharCode(65 + index);
                const reasonLabel = opt.isCorrect
                  ? "Correct Rationale"
                  : "Distractor Explanation";

                return (
                  <li
                    key={index}
                    className="border border-gray-200 p-4 rounded-xl shadow-sm bg-gray-50"
                  >
                    <div className="flex items-start space-x-3">
                      <span className="font-extrabold text-xl text-indigo-600 w-8 flex-shrink-0">
                        {char}.
                      </span>
                      <p className="text-gray-800 font-medium">{opt.text}</p>
                    </div>

                    {/* Rationale/Reason Block (Answer Key View) */}
                    <div className="mt-3 ml-8 p-3 bg-white rounded-lg border-l-4 shadow-inner border-dashed">
                      <p
                        className={`font-bold text-sm ${
                          opt.isCorrect
                            ? "text-green-700 border-green-400"
                            : "text-red-700 border-red-400"
                        }`}
                      >
                        {reasonLabel}:
                      </p>
                      <p className="text-gray-600 text-sm mt-1">
                        {opt.reason || "No rationale provided yet."}
                      </p>
                    </div>

                    {/* Internal Comment Block */}
                    {opt.comment && (
                      <div className="mt-2 ml-8 p-2 text-xs bg-yellow-50 text-yellow-800 rounded-lg flex items-center border border-yellow-200">
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

            {/* New Image Upload and Display Block at the bottom of the content */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <label className="block text-lg font-bold text-gray-800 mb-3">
                Question Media Attachments
              </label>
              <label
                htmlFor="image-upload"
                className="flex items-center justify-center border-2 border-dashed border-indigo-300 rounded-xl p-6 cursor-pointer hover:bg-indigo-50 transition-colors"
              >
                <UploadCloud size={28} className="text-indigo-600 mr-3" />
                <span className="text-indigo-700 font-semibold">
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
                  <p className="text-sm font-semibold text-gray-700">
                    Uploaded Files:
                  </p>
                  {imageFiles.map((img) => (
                    <div
                      key={img.id}
                      className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {/* Added thumbnail image next to the file name */}
                        <img
                          src={img.url}
                          alt={`Thumbnail of ${img.name}`}
                          className="w-10 h-10 rounded object-cover border border-indigo-300"
                          onError={(
                            e: React.SyntheticEvent<HTMLImageElement, Event>
                          ) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              "https://placehold.co/40x40/ccc/000?text=File";
                          }}
                        />
                        <span className="text-sm font-medium text-gray-700 truncate">
                          {img.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({img.size} KB)
                        </span>
                      </div>
                      <button
                        onClick={() => removeImage(img.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <ActionButton
              className="mt-8 w-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg text-lg"
              onClick={() => {
                console.log("Finalizing question...");
                // TODO: Implement finalize question logic
              }}
            >
              Finalize Question
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
