import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  ShieldCheck,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
  Sparkles,
} from "lucide-react";
import { EntitlementDefinition, EntitlementType } from "../../types/subscription";
import { EntitlementDefinitionsService } from "../../services/subscriptions/entitlement-definitions.service";
import { ProductSubtypesService } from "../../services/products/product-subtypes.service";
import { ProductSubtype } from "../../types/product";
import { CreateResponse } from "../../services/base/api-types";
import { getApiErrorMessage } from "@/app/services/base/api-http-error";
import { Separator } from "@/shared/ui/separator";

interface EntitlementDefinitionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  definition?: EntitlementDefinition | null;
  onDefinitionSaved: (definition: EntitlementDefinition) => void;
  mode: "create" | "edit";
}

/** Turn a title into a safe internal code (lowercase, dots between words). */
function suggestKeyFromTitle(title: string): string {
  const t = title.trim().toLowerCase();
  if (!t) return "";
  return t
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .replace(/\.{2,}/g, ".");
}

/** Sentinel: user will type their own code (shown with text field). */
const CUSTOM_INTERNAL_CODE = "__custom__";

/**
 * Built-in identifiers used across the app and seed data — pick one instead of typing codes.
 * Keys must stay stable; they are referenced by guards and package setup.
 */
const INTERNAL_CODE_PRESETS: Array<{
  key: string;
  menuLabel: string;
  suggestedDisplayName: string;
  suggestedDescription?: string;
  defaultType: EntitlementType;
}> = [
  {
    key: "qbank.access",
    menuLabel: "Question bank",
    suggestedDisplayName: "Qbank Access",
    suggestedDescription: "Access to the question bank module",
    defaultType: "BOOLEAN",
  },
  {
    key: "study.flashcards",
    menuLabel: "Flashcards",
    suggestedDisplayName: "Flashcards",
    suggestedDescription: "Spaced-repetition flashcards access",
    defaultType: "BOOLEAN",
  },
  {
    key: "study.planner",
    menuLabel: "Study planner",
    suggestedDisplayName: "Study Planner",
    suggestedDescription: "Study planner access",
    defaultType: "BOOLEAN",
  },
  {
    key: "study.notes",
    menuLabel: "Notes",
    suggestedDisplayName: "Notes",
    suggestedDescription: "Personal notes access",
    defaultType: "BOOLEAN",
  },
  {
    key: "aitutor.chat",
    menuLabel: "AI Tutor (chat quota)",
    suggestedDisplayName: "AI Tutor Chat",
    suggestedDescription: "Daily or monthly chat limits for AI Tutor",
    defaultType: "NUMBER_LIMIT",
  },
  {
    key: "medprepai.access",
    menuLabel: "MedPrepAI — general access",
    suggestedDisplayName: "MedPrepAI Access",
    suggestedDescription: "Access to MedPrepAI cases and modes",
    defaultType: "BOOLEAN",
  },
  {
    key: "medprepai.modes",
    menuLabel: "MedPrepAI — which modes are enabled",
    suggestedDisplayName: "MedPrepAI Modes",
    suggestedDescription: "Which MedPrepAI modes are included (configured on the package)",
    defaultType: "SET",
  },
];

const TYPE_OPTIONS: {
  value: EntitlementType;
  title: string;
  hint: string;
}[] = [
  {
    value: "BOOLEAN",
    title: "Yes / No access",
    hint: "The feature is either included or not. Use this for most toggles (e.g. “Can use AI Tutor”).",
  },
  {
    value: "SET",
    title: "Choose from a list",
    hint: "Lets you grant specific items from a list when you attach this to a package (more setup in package settings).",
  },
  {
    value: "NUMBER_LIMIT",
    title: "Limited amount",
    hint: "For quotas such as “10 chats per day” or “50 cases per month”. You set the numbers when linking to a package.",
  },
  {
    value: "JSON_CONSTRAINTS",
    title: "Advanced (developer)",
    hint: "Complex rules only your technical team should configure. Prefer one of the options above unless you know you need this.",
  },
];

function FieldHelp({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
      {children}
    </p>
  );
}

export default function EntitlementDefinitionFormModal({
  isOpen,
  onClose,
  definition,
  onDefinitionSaved,
  mode,
}: EntitlementDefinitionFormModalProps) {
  const isCreateMode = mode === "create";

  const [formData, setFormData] = useState<Partial<EntitlementDefinition>>({
    key: "",
    displayName: "",
    description: "",
    productSubtypeId: null,
    type: "BOOLEAN",
    isActive: true,
  });
  const [subtypes, setSubtypes] = useState<ProductSubtype[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  /** Create mode: which preset key is selected, or custom, or "" (not chosen yet). */
  const [internalCodeChoice, setInternalCodeChoice] = useState<string>("");

  const service = useMemo(() => new EntitlementDefinitionsService(), []);
  const subtypesService = useMemo(() => new ProductSubtypesService(), []);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSuccess(false);
    if (isCreateMode) {
      setInternalCodeChoice("");
      setFormData({
        key: "",
        displayName: "",
        description: "",
        productSubtypeId: null,
        type: "BOOLEAN",
        isActive: true,
      });
    } else if (definition) {
      setFormData({
        key: definition.key,
        displayName: definition.displayName,
        description: definition.description || "",
        productSubtypeId: definition.productSubtypeId ?? null,
        type: definition.type,
        isActive: definition.isActive,
      });
    }
  }, [definition, isCreateMode, isOpen]);

  useEffect(() => {
    const load = async () => {
      if (!isOpen) return;
      try {
        setOptionsLoading(true);
        const resp = await subtypesService.getSubtypes({
          page: 1,
          limit: 200,
          sortBy: "name",
          sortOrder: "asc",
          status: "ACTIVE",
        });
        setSubtypes(Array.isArray(resp) ? resp : resp.data);
      } catch {
        setSubtypes([]);
      } finally {
        setOptionsLoading(false);
      }
    };
    load();
  }, [isOpen, subtypesService]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const selectedTypeMeta = TYPE_OPTIONS.find((o) => o.value === formData.type);

  const applyInternalCodePreset = (presetKey: string) => {
    const preset = INTERNAL_CODE_PRESETS.find((p) => p.key === presetKey);
    if (!preset) return;
    setFormData((prev) => ({
      ...prev,
      key: preset.key,
      type: preset.defaultType,
      displayName: prev.displayName?.trim()
        ? prev.displayName
        : preset.suggestedDisplayName,
      description: prev.description?.trim()
        ? prev.description
        : preset.suggestedDescription ?? "",
    }));
  };

  const onInternalCodeChoiceChange = (value: string) => {
    setInternalCodeChoice(value);
    setError(null);
    if (value === "") {
      setFormData((p) => ({ ...p, key: "" }));
      return;
    }
    if (value === CUSTOM_INTERNAL_CODE) {
      setFormData((p) => ({ ...p, key: "" }));
      return;
    }
    applyInternalCodePreset(value);
  };

  const fillKeyFromTitle = () => {
    const suggested = suggestKeyFromTitle(formData.displayName || "");
    if (!suggested) {
      setError("Enter a name above first — we’ll turn it into a code.");
      return;
    }
    setFormData((p) => ({ ...p, key: suggested }));
    setInternalCodeChoice(CUSTOM_INTERNAL_CODE);
    setError(null);
  };

  const presetMatchingEditKey =
    !isCreateMode && definition
      ? INTERNAL_CODE_PRESETS.find((p) => p.key === definition.key)
      : undefined;

  const validate = () => {
    if (!formData.displayName?.trim()) {
      return "Please enter a name for this feature (what people will understand at a glance).";
    }
    if (isCreateMode) {
      if (!internalCodeChoice) {
        return "Choose what this feature connects to in the system (dropdown below), or pick “Custom code”.";
      }
      if (internalCodeChoice === CUSTOM_INTERNAL_CODE && !formData.key?.trim()) {
        return "Enter a custom internal code, or click “Suggest from name”.";
      }
    }
    if (!formData.key?.trim()) {
      return "An internal code is required.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      if (isCreateMode) {
        const resp = await service.createDefinition(formData);
        setSuccess(true);
        setTimeout(() => {
          if ("key" in resp && "displayName" in resp) {
            onDefinitionSaved(resp as EntitlementDefinition);
            onClose();
          } else {
            const cr = resp as CreateResponse;
            service
              .getDefinition(cr.id)
              .then((d) => {
                onDefinitionSaved(d);
                onClose();
              })
              .catch(onClose);
          }
        }, 600);
      } else if (definition) {
        const resp = await service.updateDefinition(definition.id, formData);
        setSuccess(true);
        setTimeout(() => {
          if ("key" in resp && "displayName" in resp) {
            onDefinitionSaved(resp as EntitlementDefinition);
            onClose();
          } else {
            service
              .getDefinition(definition.id)
              .then((d) => {
                onDefinitionSaved(d);
                onClose();
              })
              .catch(onClose);
          }
        }, 600);
      }
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Could not save. Check your connection and try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl shadow-[0_22px_60px_-45px_rgba(15,23,42,0.65)] ring-1 ring-black/5 dark:ring-white/10 max-w-3xl w-full max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/10">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500/15 via-sky-500/10 to-purple-500/10 ring-1 ring-indigo-500/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-indigo-700" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {isCreateMode ? "Add a subscription feature" : "Edit subscription feature"}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-xl">
                Features are the building blocks you attach to subscription packages (e.g. question bank, AI tutor).
                You only define what the feature <span className="font-medium">is</span> here — packages control who gets it.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg flex gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
              <span className="text-sm text-green-800 dark:text-green-200">Saved successfully.</span>
            </div>
          )}

          {/* Section: names */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                What this feature is called
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
                Use clear, everyday language. This helps your team when configuring packages.
              </p>
            </div>

            <div>
              <label
                htmlFor="ent-display-name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
              >
                Feature name <span className="text-red-500">*</span>
              </label>
              <input
                id="ent-display-name"
                value={formData.displayName || ""}
                onChange={(e) => setFormData((p) => ({ ...p, displayName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                placeholder="e.g. AI Tutor access"
                required
                autoComplete="off"
              />
              <FieldHelp>Shown in admin screens and tools when you pick features for a package.</FieldHelp>
            </div>

            <div>
              <label
                htmlFor="ent-desc"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
              >
                Notes for your team <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="ent-desc"
                value={formData.description || ""}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                placeholder="When should this be turned on? Any reminders for future admins?"
              />
            </div>
          </div>

          <Separator className="bg-slate-200 dark:bg-slate-700" />

          {/* Section: system fields */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                How the system identifies this feature
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
                Pick the product area this ties to — the app fills in the technical code for you. Use “Custom code”
                only if you are adding something brand new.
              </p>
            </div>

            <div>
              <label
                htmlFor="ent-code-choice"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
              >
                Internal identifier <span className="text-red-500">*</span>
              </label>

              {isCreateMode ? (
                <>
                  <select
                    id="ent-code-choice"
                    value={internalCodeChoice}
                    onChange={(e) => onInternalCodeChoiceChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">Select what this links to…</option>
                    {INTERNAL_CODE_PRESETS.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.menuLabel}
                      </option>
                    ))}
                    <option value={CUSTOM_INTERNAL_CODE}>Custom code — I’ll type it myself</option>
                  </select>
                  <FieldHelp>
                    These options match the features your product already knows about (question bank, AI Tutor,
                    MedPrepAI, etc.). Choosing one sets the correct code automatically.
                  </FieldHelp>

                  {internalCodeChoice &&
                    internalCodeChoice !== CUSTOM_INTERNAL_CODE &&
                    internalCodeChoice !== "" && (
                      <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50/90 dark:bg-slate-900/50 px-3 py-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                          Technical code (saved with this feature)
                        </p>
                        <code className="text-sm font-mono text-slate-800 dark:text-slate-200 break-all">
                          {formData.key}
                        </code>
                      </div>
                    )}

                  {internalCodeChoice === CUSTOM_INTERNAL_CODE && (
                    <div className="mt-3 space-y-2">
                      <div className="flex flex-wrap items-end gap-2">
                        <div className="flex-1 min-w-[200px]">
                          <label
                            htmlFor="ent-key-custom"
                            className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
                          >
                            Custom internal code
                          </label>
                          <input
                            id="ent-key-custom"
                            value={formData.key || ""}
                            onChange={(e) =>
                              setFormData((p) => ({ ...p, key: e.target.value }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                            placeholder="e.g. reporting.exports"
                            autoComplete="off"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={fillKeyFromTitle}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                        >
                          <Sparkles className="h-4 w-4 shrink-0" />
                          Suggest from name
                        </button>
                      </div>
                      <FieldHelp>
                        Lowercase letters, numbers, and dots only (e.g.{" "}
                        <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">
                          study.flashcards
                        </code>
                        ). Use “Suggest from name” after filling in the feature name above.
                      </FieldHelp>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50/90 dark:bg-slate-900/50 px-3 py-3 space-y-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Technical code (cannot change)</p>
                    <code className="text-sm font-mono text-slate-900 dark:text-slate-100 break-all">
                      {formData.key}
                    </code>
                    {presetMatchingEditKey && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 pt-1">
                        Matches preset:{" "}
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {presetMatchingEditKey.menuLabel}
                        </span>
                      </p>
                    )}
                  </div>
                  <FieldHelp>
                    This code may already be attached to subscription packages; it stays fixed so links do not
                    break.
                  </FieldHelp>
                </>
              )}
            </div>

            <div>
              <label
                htmlFor="ent-type"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
              >
                Type of rule <span className="text-red-500">*</span>
              </label>
              <select
                id="ent-type"
                value={(formData.type as EntitlementType) || "BOOLEAN"}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, type: e.target.value as EntitlementType }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.title}
                  </option>
                ))}
              </select>
              {selectedTypeMeta && (
                <div className="mt-2 flex gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-900/50 p-3">
                  <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedTypeMeta.hint}{" "}
                    </span>
                    {selectedTypeMeta.value === "JSON_CONSTRAINTS" && (
                      <span className="text-amber-800 dark:text-amber-200">
                        If you are unsure, choose “Yes / No access” instead.
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="ent-scope"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
              >
                Only for a specific product line? <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <select
                id="ent-scope"
                value={formData.productSubtypeId || ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    productSubtypeId: e.target.value ? e.target.value : null,
                  }))
                }
                disabled={optionsLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 dark:disabled:bg-slate-900 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="">No — applies across all product lines</option>
                {subtypes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {(s.product?.name ? `${s.product.name} — ` : "") + s.name}
                  </option>
                ))}
              </select>
              <FieldHelp>
                Leave as “No” unless this feature only makes sense for one subject or course type (e.g. MedPrep vs Qbank).
              </FieldHelp>
            </div>
          </div>

          <Separator className="bg-slate-200 dark:bg-slate-700" />

          <div className="rounded-lg border border-slate-200 dark:border-slate-600 p-4 bg-white/60 dark:bg-slate-900/40">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(formData.isActive)}
                onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                className="h-4 w-4 mt-0.5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span>
                <span className="block text-sm font-medium text-gray-800 dark:text-gray-100">
                  Feature is available to use
                </span>
                <span className="block text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Turn off to hide this definition when building packages (existing subscriptions are not deleted).
                </span>
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isCreateMode ? "Save feature" : "Save changes"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
