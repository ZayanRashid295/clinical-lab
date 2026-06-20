"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/shared/ui/use-toast";
import { Loader2, FileText, Upload, X, FileQuestion } from "lucide-react";
import { QuestionBuilderService } from "@/app/services/questions/question-builder.service";
import { QuestionsService } from "@/app/services/questions/questions.service";
import { getApiErrorMessage } from "@/app/services/base/api-http-error";
import type { ConvertFileResult, QuestionData } from "./question-builder/types";
import { BatchReviewSidebar } from "./question-builder/BatchReviewSidebar";
import type { BatchItemStatus } from "./question-builder/batch-review-utils";
import {
  initialStatuses,
  nextPendingId,
} from "./question-builder/batch-review-utils";
import { convertQuestionBuilderToCreatorData } from "./question-builder/question-builder-to-question";
import {
  mergeResolvedMetadata,
  resolveCreatorMetadataIds,
} from "./resolve-creator-metadata";
import type { QuestionCreatorData } from "./question-creator/types";
import QuestionCreator from "./question-creator/QuestionCreator";
import { convertOldQuestionToNew } from "./migration-utils";
import { coerceLabelString } from "./metadata-label-utils";

export interface SaveQuestionOptions {
  batchReview?: boolean;
}

interface QuestionBuilderUploaderProps {
  onSave: (
    questionData: QuestionCreatorData,
    options?: SaveQuestionOptions,
  ) => Promise<boolean>;
  onCancel?: () => void;
}

const BATCH_STORAGE_KEY = "question-builder-batch-v1";

type PersistedBatch = {
  batchResults: ConvertFileResult[];
  statuses: Record<string, BatchItemStatus>;
  activeId: string | null;
};

function readPersistedBatch(): PersistedBatch | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(BATCH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedBatch;
    if (!parsed.batchResults?.length) return null;
    return parsed;
  } catch {
    sessionStorage.removeItem(BATCH_STORAGE_KEY);
    return null;
  }
}

function persistBatch(data: PersistedBatch | null) {
  if (typeof window === "undefined") return;
  if (!data?.batchResults?.length) {
    sessionStorage.removeItem(BATCH_STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(BATCH_STORAGE_KEY, JSON.stringify(data));
}

export default function QuestionBuilderUploader({
  onSave,
  onCancel,
}: QuestionBuilderUploaderProps) {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [phase, setPhase] = useState<"upload" | "batch">("upload");
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [batchResults, setBatchResults] = useState<ConvertFileResult[]>([]);
  const [statuses, setStatuses] = useState<Record<string, BatchItemStatus>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [creatorData, setCreatorData] = useState<Partial<QuestionCreatorData> | null>(
    null,
  );
  const dataCacheRef = useRef<Record<string, Partial<QuestionCreatorData>>>({});
  const restoredRef = useRef(false);

  const questionBuilderService = useMemo(() => new QuestionBuilderService(), []);
  const questionsService = useMemo(() => new QuestionsService(), []);

  const addFiles = (incoming: FileList | File[]) => {
    const docxFiles = Array.from(incoming).filter((file) =>
      file.name.toLowerCase().endsWith(".docx"),
    );
    if (!docxFiles.length) {
      toast({
        title: "Invalid files",
        description: "Please select .docx files only",
        variant: "destructive",
      });
      return;
    }
    setSelectedFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      const merged = [...prev];
      for (const file of docxFiles) {
        if (!names.has(file.name)) merged.push(file);
      }
      return merged;
    });
  };

  const uploadImagesForQuestion = async (
    questionId: string,
    data: QuestionData,
  ): Promise<Record<string, string>> => {
    const imageUrls: Record<string, string> = {};
    const diagramSources =
      data.diagrams?.length
        ? data.diagrams
        : data.diagram
          ? [data.diagram]
          : [];
    for (const diagram of diagramSources) {
      for (const img of diagram.images ?? []) {
        try {
          const blob = await questionBuilderService.fetchImageBlob(
            questionId,
            img.filename,
          );
          const file = new File([blob], img.filename, {
            type: blob.type || "image/png",
          });
          let url: string | undefined;
          try {
            const result = await questionsService.uploadImage(file);
            url = result.url;
          } catch {
            // Fall back to blob URL if permanent upload fails
          }
          imageUrls[img.filename] = url || URL.createObjectURL(blob);
        } catch {
          // Skip images that cannot be fetched
        }
      }
    }
    return imageUrls;
  };

  const loadQuestionForEdit = useCallback(
    async (questionId: string) => {
      setShowUploadPanel(false);

      if (dataCacheRef.current[questionId]) {
        setActiveId(questionId);
        setCreatorData(dataCacheRef.current[questionId]);
        return;
      }

      setLoadingId(questionId);
      try {
        const data = await questionBuilderService.getQuestion(questionId);
        const imageUrls = await uploadImagesForQuestion(questionId, data);
        const parsed = convertQuestionBuilderToCreatorData(data, imageUrls);
        if (parsed.metadata) {
          const resolved = await resolveCreatorMetadataIds(parsed.metadata).catch(
            () => ({}),
          );
          parsed.metadata = mergeResolvedMetadata(parsed.metadata, resolved);
        }
        dataCacheRef.current[questionId] = parsed;
        setActiveId(questionId);
        setCreatorData(parsed);
      } catch (err) {
        toast({
          title: "Error",
          description: getApiErrorMessage(err, "Failed to load question"),
          variant: "destructive",
        });
      } finally {
        setLoadingId(null);
      }
    },
    [questionBuilderService, questionsService, toast],
  );

  useEffect(() => {
    if (phase !== "batch" || !batchResults.length) return;
    persistBatch({ batchResults, statuses, activeId });
  }, [phase, batchResults, statuses, activeId]);

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const saved = readPersistedBatch();
    if (!saved) return;
    setBatchResults(saved.batchResults);
    setStatuses(saved.statuses ?? initialStatuses(saved.batchResults));
    setPhase("batch");
    const openId =
      saved.activeId && saved.statuses?.[saved.activeId] !== "saved"
        ? saved.activeId
        : nextPendingId(saved.batchResults, saved.statuses ?? initialStatuses(saved.batchResults));
    if (openId) {
      void loadQuestionForEdit(openId);
    }
  }, [loadQuestionForEdit]);

  const startBatch = (results: ConvertFileResult[]) => {
    const nextStatuses = initialStatuses(results);
    setBatchResults(results);
    setStatuses(nextStatuses);
    setPhase("batch");
    setShowUploadPanel(false);
    setActiveId(null);
    setCreatorData(null);

    const first = nextPendingId(results, nextStatuses);
    if (first) {
      void loadQuestionForEdit(first);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles.length || uploading) return;
    setUploading(true);

    try {
      const response = await questionBuilderService.convertFiles(selectedFiles);
      setSelectedFiles([]);

      if (phase === "batch") {
        setBatchResults((prev) => {
          const merged = [...prev];
          const names = new Set(prev.map((r) => r.sourceName));
          for (const result of response.results) {
            if (!names.has(result.sourceName)) merged.push(result);
          }
          return merged;
        });
        setStatuses((prev) => ({
          ...prev,
          ...initialStatuses(response.results),
        }));
        setShowUploadPanel(false);

        const firstNew = response.results.find((r) => r.success && r.questionId);
        if (firstNew?.questionId) {
          void loadQuestionForEdit(firstNew.questionId);
        }
      } else {
        startBatch(response.results);
      }

      toast({
        title: response.failed > 0 ? "Conversion completed with errors" : "Success",
        description:
          response.failed > 0
            ? `${response.succeeded} succeeded, ${response.failed} failed validation`
            : `Converted ${response.succeeded} question(s)`,
      });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: getApiErrorMessage(err, "Failed to convert files"),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEditorSave = async (questionData: QuestionCreatorData) => {
    if (!activeId) return;
    const savedId = activeId;
    setSaving(true);
    try {
      const ok = await onSave(questionData, { batchReview: true });
      if (!ok) return;

      dataCacheRef.current[savedId] = {
        ...questionData,
        metadata: {
          ...questionData.metadata,
          parsedCategoryName: coerceLabelString(questionData.metadata.parsedCategoryName),
          parsedProductName: coerceLabelString(questionData.metadata.parsedProductName),
          parsedTopicName: coerceLabelString(questionData.metadata.parsedTopicName),
          parsedSubtopicName: coerceLabelString(questionData.metadata.parsedSubtopicName),
          parsedMcqTitle: coerceLabelString(questionData.metadata.parsedMcqTitle),
          subject: coerceLabelString(questionData.metadata.subject),
          system: coerceLabelString(questionData.metadata.system),
        },
      };
      const updatedStatuses = { ...statuses, [savedId]: "saved" as const };
      setStatuses(updatedStatuses);

      toast({
        title: "Saved",
        description: `Question ${savedId} saved to the bank.`,
      });

      const nextId = nextPendingId(batchResults, updatedStatuses, savedId);
      if (nextId) {
        await loadQuestionForEdit(nextId);
      } else {
        setActiveId(null);
        setCreatorData(null);
        persistBatch(null);
        toast({
          title: "Batch complete",
          description: "All questions in this batch have been saved.",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditorCancel = () => {
    setActiveId(null);
    setCreatorData(null);
  };

  const handleFinishBatch = async () => {
    const pending = Object.entries(statuses).filter(([, s]) => s === "pending");
    if (pending.length > 0) {
      const proceed = await confirm({
        title: "Leave batch review?",
        message: `${pending.length} question(s) are not saved yet. Leave batch review anyway?`,
        confirmText: "Leave",
        variant: "danger",
      });
      if (!proceed) return;
    }
    persistBatch(null);
    onCancel?.();
  };

  const handleUploadMore = () => {
    setShowUploadPanel(true);
    setActiveId(null);
    setCreatorData(null);
    setSelectedFiles([]);
  };

  const renderUploadDropzone = (compact = false) => (
    <div
      className={`rounded-lg border-2 border-dashed text-center transition-colors ${
        compact ? "p-6" : "p-8"
      } ${
        dragOver
          ? "border-primary bg-primary/5"
          : "border-border dark:border-gray-600"
      } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        addFiles(e.dataTransfer.files);
      }}
    >
      <Upload className={`mx-auto text-muted-foreground ${compact ? "mb-2 h-8 w-8" : "mb-3 h-10 w-10"}`} />
      <p className={`font-medium ${compact ? "text-sm" : "text-sm mb-1"}`}>
        Drop .docx files here
      </p>
      <p className={`text-muted-foreground ${compact ? "text-xs mb-2" : "text-xs mb-3"}`}>
        Multiple files supported
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx"
        multiple
        hidden
        disabled={uploading}
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        Browse files
      </Button>
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-3 text-left">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedFiles.length} file(s) ready
            </span>
            <Button
              type="button"
              size="sm"
              disabled={uploading}
              onClick={() => void handleUpload()}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Converting…
                </>
              ) : (
                `Convert ${selectedFiles.length} file(s)`
              )}
            </Button>
          </div>
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {selectedFiles.map((file) => (
              <li
                key={file.name}
                className="flex items-center gap-2 rounded bg-muted/50 px-2 py-1 text-sm dark:bg-gray-700/50"
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{file.name}</span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  disabled={uploading}
                  onClick={() =>
                    setSelectedFiles((prev) => prev.filter((f) => f.name !== file.name))
                  }
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const editorInitialData = useMemo(() => {
    if (!creatorData) return undefined;
    return Array.isArray(creatorData.stem)
      ? creatorData
      : convertOldQuestionToNew(creatorData as Parameters<typeof convertOldQuestionToNew>[0]);
  }, [creatorData]);

  if (phase === "batch") {
    const succeededCount = batchResults.filter((r) => r.success).length;

    return (
      <div className="flex h-[calc(100vh-12rem)] min-h-[520px] overflow-hidden rounded-xl border border-border bg-card dark:border-gray-700 dark:bg-gray-800">
        <BatchReviewSidebar
          results={batchResults}
          statuses={statuses}
          activeId={activeId}
          loadingId={loadingId}
          saving={saving}
          onSelect={(id) => void loadQuestionForEdit(id)}
          onUploadMore={handleUploadMore}
          onFinish={() => void handleFinishBatch()}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          {showUploadPanel ? (
            <div className="flex flex-1 flex-col overflow-y-auto p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Add more files to this batch</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUploadPanel(false)}
                >
                  Cancel
                </Button>
              </div>
              {renderUploadDropzone(true)}
            </div>
          ) : activeId && creatorData ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2 dark:border-gray-700">
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  Reviewing{" "}
                  <span className="font-semibold text-foreground">{activeId}</span>
                  {statuses[activeId] === "saved" && (
                    <span className="ml-2 text-green-600 dark:text-green-400">(saved)</span>
                  )}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                  onClick={handleEditorCancel}
                >
                  Back to list
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <QuestionCreator
                  key={activeId}
                  initialData={editorInitialData}
                  onSave={(data) => void handleEditorSave(data)}
                  onCancel={handleEditorCancel}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <FileQuestion className="h-12 w-12 text-muted-foreground/60" />
              <div>
                <p className="font-medium">Select a question to review</p>
                <p className="mt-1 text-sm text-muted-foreground dark:text-gray-400">
                  {succeededCount > 0
                    ? "Choose an item from the batch list on the left, then review and save."
                    : "No questions converted successfully. Upload more files or finish."}
                </p>
              </div>
              {succeededCount === 0 && (
                <Button type="button" variant="outline" onClick={handleUploadMore}>
                  Upload files
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Question Builder</h2>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Upload structured .docx files — validated and converted without AI
            </p>
          </div>
          {onCancel && (
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Back to list
            </Button>
          )}
        </div>

        <div
          className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border dark:border-gray-600"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            addFiles(e.dataTransfer.files);
          }}
        >
          <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="mb-1 text-sm font-medium">Drop .docx files here</p>
          <p className="mb-3 text-xs text-muted-foreground">
            or browse — multiple files supported (MCQ template format)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            multiple
            hidden
            disabled={uploading}
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            Browse files
          </Button>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedFiles.length} file(s) ready
              </span>
              <Button
                type="button"
                disabled={uploading}
                onClick={() => void handleUpload()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating & converting…
                  </>
                ) : (
                  `Convert ${selectedFiles.length} file(s)`
                )}
              </Button>
            </div>
            <ul className="space-y-1">
              {selectedFiles.map((file) => (
                <li
                  key={file.name}
                  className="flex items-center gap-2 rounded bg-muted/50 px-2 py-1 text-sm dark:bg-gray-700/50"
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{file.name}</span>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    disabled={uploading}
                    onClick={() =>
                      setSelectedFiles((prev) => prev.filter((f) => f.name !== file.name))
                    }
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
