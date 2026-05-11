import React, { useMemo, useState, useEffect } from "react";
import {
  X,
  Package,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import {
  SubscriptionPackage,
  CreateSubscriptionPackageDto,
  UpdateSubscriptionPackageDto,
  EntitlementDefinition,
} from "../../types/subscription";
import { SubscriptionPackagesService } from "../../services/subscriptions/subscription-packages.service";
import { CreateResponse } from "../../services/base/api-types";
import { getApiErrorMessage } from "@/app/services/base/api-http-error";
import { ProductSubtypesService } from "../../services/products/product-subtypes.service";
import { EntitlementDefinitionsService } from "../../services/subscriptions/entitlement-definitions.service";
import { ProductSubtype } from "../../types/product";
import { MEDPREP_MODES } from "../medprep-ai/modes";

/** Allows empty strings while typing so we never coerce to 0 on each keystroke. */
type PackageFormFields = Omit<
  CreateSubscriptionPackageDto,
  "price" | "validityDays"
> & {
  price: number | "";
  validityDays: number | "";
};

interface SubscriptionPackageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  package?: SubscriptionPackage | null;
  onPackageSaved: (
    pkg: SubscriptionPackage,
    meta?: { created: boolean }
  ) => void;
  mode: "create" | "edit";
}

/** Short labels so rows stay readable (full type still in tooltip). */
const ENTITLEMENT_TYPE_HINT: Record<string, string> = {
  BOOLEAN: "Toggle",
  NUMBER_LIMIT: "Quota",
  SET: "Options",
  JSON_CONSTRAINTS: "Custom",
};

function normalizeQuotaPeriod(raw: unknown): "DAY" | "MONTH" {
  const p = typeof raw === "string" ? raw.toUpperCase() : "";
  return p === "MONTH" ? "MONTH" : "DAY";
}

/** SET entitlements: MedPrep mode checkboxes, or generic add/remove list — no raw JSON. */
function SetEntitlementValueEditor({
  definitionKey,
  valueJson,
  onChange,
}: {
  definitionKey: string;
  valueJson: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const items: string[] = Array.isArray(valueJson?.items)
    ? (valueJson.items as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  const [draftId, setDraftId] = useState("");

  if (definitionKey === "medprepai.modes") {
    const limitsRaw = valueJson.limitsPerMode;
    const limitsPerMode: Record<string, number> =
      limitsRaw && typeof limitsRaw === "object" && !Array.isArray(limitsRaw)
        ? Object.fromEntries(
            Object.entries(limitsRaw as Record<string, unknown>).filter(
              ([, v]) => typeof v === "number" && Number.isFinite(v)
            )
          ) as Record<string, number>
        : {};
    const limitPeriod: "DAY" | "MONTH" =
      typeof valueJson.limitPeriod === "string" &&
      valueJson.limitPeriod.toUpperCase() === "DAY"
        ? "DAY"
        : "MONTH";

    const patchModes = (partial: Record<string, unknown>) => {
      onChange({
        enabled: true,
        items,
        limitsPerMode,
        limitPeriod,
        ...partial,
      });
    };

    return (
      <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Which MedPrep modes are included, and how many <span className="italic">distinct cases</span> per
          student can they start in each mode?
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Leave “Max cases” blank for unlimited (within that mode). Counts reset each day or month — choose
          below.
        </p>
        <div className="space-y-3">
          {MEDPREP_MODES.map((mode) => {
            const checked = items.includes(mode.id);
            const capVal =
              limitsPerMode[mode.id] !== undefined ? String(limitsPerMode[mode.id]) : "";
            return (
              <div
                key={mode.id}
                className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/90 dark:bg-gray-900/40 px-3 py-2.5"
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    checked={checked}
                    onChange={(e) => {
                      const next = new Set(items);
                      const nextLimits = { ...limitsPerMode };
                      if (e.target.checked) next.add(mode.id);
                      else {
                        next.delete(mode.id);
                        delete nextLimits[mode.id];
                      }
                      onChange({
                        enabled: true,
                        items: Array.from(next),
                        limitsPerMode: nextLimits,
                        limitPeriod,
                      });
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                      {mode.title}
                    </span>
                    <span className="block text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {mode.summary}
                    </span>
                  </span>
                </label>
                {checked && (
                  <div className="mt-2 pl-7 flex flex-wrap items-center gap-2">
                    <label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      Max distinct cases
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="∞ unlimited"
                      value={capVal}
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        const nextLimits = { ...limitsPerMode };
                        if (raw === "") {
                          delete nextLimits[mode.id];
                        } else {
                          const n = parseInt(raw, 10);
                          if (Number.isFinite(n)) nextLimits[mode.id] = n;
                        }
                        patchModes({ limitsPerMode: nextLimits });
                      }}
                      className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-900"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Count resets every
          </label>
          <select
            value={limitPeriod}
            onChange={(e) => {
              const v = e.target.value === "DAY" ? "DAY" : "MONTH";
              patchModes({ limitPeriod: v });
            }}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-slate-900"
          >
            <option value="MONTH">Month</option>
            <option value="DAY">Day</option>
          </select>
        </div>
      </div>
    );
  }

  const removeItem = (id: string) => {
    onChange({ enabled: true, items: items.filter((x) => x !== id) });
  };

  const addDraft = () => {
    const id = draftId.trim();
    if (!id || items.includes(id)) return;
    onChange({ enabled: true, items: [...items, id] });
    setDraftId("");
  };

  return (
    <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
        List values included for this package
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Use the internal ids your team agreed on (same spelling as in code). Add one at a time below.
      </p>
      {items.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {items.map((id) => (
            <li
              key={id}
              className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200"
            >
              {id}
              <button
                type="button"
                onClick={() => removeItem(id)}
                className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600"
                aria-label={`Remove ${id}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={draftId}
          onChange={(e) => setDraftId(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addDraft();
            }
          }}
          placeholder="internal-id"
          className="flex-1 min-w-[140px] px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-900 font-mono"
        />
        <button
          type="button"
          onClick={addDraft}
          className="px-3 py-1.5 text-sm font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export default function SubscriptionPackageFormModal({
  isOpen,
  onClose,
  package: pkg,
  onPackageSaved,
  mode,
}: SubscriptionPackageFormModalProps) {
  const [formData, setFormData] = useState<PackageFormFields>({
    productSubtypeId: "",
    name: "",
    description: "",
    price: "",
    currency: "USD",
    validityDays: 30,
    isActive: true,
  });
  const [subtypes, setSubtypes] = useState<ProductSubtype[]>([]);
  const [entitlementDefs, setEntitlementDefs] = useState<EntitlementDefinition[]>([]);
  const [selectedEntitlements, setSelectedEntitlements] = useState<
    Record<string, { enabled: boolean; valueJson?: any }>
  >({});
  const [quote, setQuote] = useState<any>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const packagesService = useMemo(() => new SubscriptionPackagesService(), []);
  const productSubtypesService = useMemo(() => new ProductSubtypesService(), []);
  const entitlementDefinitionsService = useMemo(
    () => new EntitlementDefinitionsService(),
    []
  );
  const isCreateMode = mode === "create";

  const hasAtLeastOneIncluded = useMemo(
    () => Object.values(selectedEntitlements).some((v) => v?.enabled),
    [selectedEntitlements]
  );

  const visibleEntitlementsForSubtype = useMemo(
    () =>
      entitlementDefs.filter(
        (d) =>
          !d.productSubtypeId ||
          d.productSubtypeId === formData.productSubtypeId
      ),
    [entitlementDefs, formData.productSubtypeId]
  );

  useEffect(() => {
    if (isOpen) {
      if (isCreateMode) {
        setFormData({
          productSubtypeId: "",
          name: "",
          description: "",
          price: "",
          currency: "USD",
          validityDays: 30,
          isActive: true,
        });
      } else if (pkg) {
        setFormData({
          productSubtypeId: pkg.productSubtypeId,
          name: pkg.name,
          description: pkg.description || "",
          price: Number(pkg.price),
          currency: pkg.currency,
          validityDays: pkg.validityDays,
          isActive: pkg.isActive,
        });
      }
      setError(null);
      setSuccess(false);
      setQuote(null);
    }
  }, [isOpen, pkg, isCreateMode]);

  useEffect(() => {
    const loadOptions = async () => {
      if (!isOpen) return;
      try {
        setOptionsLoading(true);
        const [subtypesResp, entResp] = await Promise.all([
          productSubtypesService.getSubtypes({
            listAll: true,
            sortBy: "name",
            sortOrder: "asc",
            status: "ACTIVE",
          }),
          entitlementDefinitionsService.getDefinitions({
            page: 1,
            limit: 100,
            sortBy: "displayName",
            sortOrder: "asc",
            status: "ACTIVE",
          }),
        ]);

        const resolvedSubtypes = Array.isArray(subtypesResp)
          ? subtypesResp
          : subtypesResp.data;
        const resolvedEnts = Array.isArray(entResp) ? entResp : entResp.data;
        setSubtypes(resolvedSubtypes);
        setEntitlementDefs(resolvedEnts);

        // If editing, hydrate selected entitlements from package payload (if present)
        if (!isCreateMode && pkg?.entitlements) {
          const map: Record<string, { enabled: boolean; valueJson?: any }> = {};
          for (const pe of pkg.entitlements) {
            map[pe.entitlementDefinitionId] = {
              enabled: true,
              valueJson: pe.valueJson ?? { enabled: true },
            };
          }
          setSelectedEntitlements(map);
        } else if (isCreateMode) {
          setSelectedEntitlements({});
        }
      } catch (e) {
        // keep form usable; options can be reloaded by reopening modal
        setSubtypes([]);
        setEntitlementDefs([]);
      } finally {
        setOptionsLoading(false);
      }
    };

    loadOptions();
  }, [
    entitlementDefinitionsService,
    isCreateMode,
    isOpen,
    pkg?.entitlements,
    productSubtypesService,
  ]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
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

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
      return;
    }
    if (type === "number") {
      const field = name as "price" | "validityDays";
      setFormData((prev) => {
        if (value === "") {
          return { ...prev, [field]: "" };
        }
        const parsed = parseFloat(value);
        if (!Number.isFinite(parsed)) {
          return prev;
        }
        return { ...prev, [field]: parsed };
      });
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): string | null => {
    if (!formData.productSubtypeId.trim()) {
      return "Product subtype is required";
    }
    if (!formData.name.trim()) {
      return "Package name is required";
    }
    const priceNum = Number(formData.price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      return "Enter a valid price greater than 0";
    }
    const daysNum = Number(formData.validityDays);
    if (!Number.isFinite(daysNum) || daysNum <= 0) {
      return "Validity days must be greater than 0";
    }
    if (entitlementDefs.length === 0) {
      return "Create entitlement definitions first (Subscriptions → Entitlements), then build a package.";
    }
    const visible = entitlementDefs.filter(
      (d) =>
        !d.productSubtypeId ||
        d.productSubtypeId === formData.productSubtypeId
    );
    if (formData.productSubtypeId && visible.length === 0) {
      return "No features match this product subtype. Pick another subtype or scope entitlements to this subtype.";
    }
    if (!Object.values(selectedEntitlements).some((v) => v?.enabled)) {
      return "Select at least one feature under What's included.";
    }
    return null;
  };

  /** Normalize numbers for JSON/API (backend expects numeric decimals, not ambiguous strings). */
  const sanitizedFormPayload = (): CreateSubscriptionPackageDto => {
    const price = Number(formData.price);
    const validityDays = Math.max(1, Math.floor(Number(formData.validityDays)));
    return {
      ...formData,
      price: Math.round((Number.isFinite(price) ? price : 0) * 100) / 100,
      validityDays,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = sanitizedFormPayload();
      if (isCreateMode) {
        const response = await packagesService.createPackage(payload);
        setSuccess(true);
        setTimeout(() => {
          // Handle union type: response is either CreateResponse or SubscriptionPackage
          if ("productSubtypeId" in response && "name" in response) {
            // It's a SubscriptionPackage
            const created = response as SubscriptionPackage;
            const entitlements = Object.entries(selectedEntitlements)
              .filter(([, v]) => v.enabled)
              .map(([entitlementDefinitionId, v]) => ({
                entitlementDefinitionId,
                valueJson: v.valueJson ?? { enabled: true },
              }));

            packagesService
              .setPackageEntitlements(created.id, entitlements)
              .catch(() => undefined)
              .finally(() => {
                onPackageSaved(created, { created: true });
                onClose();
              });
          } else {
            // It's a CreateResponse, refetch the created entity
            const createResponse = response as CreateResponse;
            packagesService
              .getPackage(createResponse.id)
              .then((entity) => {
                const entitlements = Object.entries(selectedEntitlements)
                  .filter(([, v]) => v.enabled)
                  .map(([entitlementDefinitionId, v]) => ({
                    entitlementDefinitionId,
                    valueJson: v.valueJson ?? { enabled: true },
                  }));

                packagesService
                  .setPackageEntitlements(entity.id, entitlements)
                  .catch(() => undefined)
                  .finally(() => {
                    onPackageSaved(entity, { created: true });
                    onClose();
                  });
              })
              .catch(() => {
                onClose();
              });
          }
        }, 1000);
      } else if (pkg) {
        const updateData: UpdateSubscriptionPackageDto = {
          productSubtypeId: payload.productSubtypeId,
          name: payload.name,
          description: payload.description,
          price: payload.price,
          currency: payload.currency,
          validityDays: payload.validityDays,
          isActive: payload.isActive,
        };
        const response = await packagesService.updatePackage(
          pkg.id,
          updateData
        );
        setSuccess(true);
        setTimeout(() => {
          // Handle union type: response is either UpdateResponse or SubscriptionPackage
          if ("productSubtypeId" in response && "name" in response) {
            // It's a SubscriptionPackage
            const updated = response as SubscriptionPackage;
            const entitlements = Object.entries(selectedEntitlements)
              .filter(([, v]) => v.enabled)
              .map(([entitlementDefinitionId, v]) => ({
                entitlementDefinitionId,
                valueJson: v.valueJson ?? { enabled: true },
              }));

            packagesService
              .setPackageEntitlements(updated.id, entitlements)
              .catch(() => undefined)
              .finally(() => {
                onPackageSaved(updated, { created: false });
                onClose();
              });
          } else {
            // It's an UpdateResponse, refetch the updated entity
            packagesService
              .getPackage(pkg.id)
              .then((entity) => {
                const entitlements = Object.entries(selectedEntitlements)
                  .filter(([, v]) => v.enabled)
                  .map(([entitlementDefinitionId, v]) => ({
                    entitlementDefinitionId,
                    valueJson: v.valueJson ?? { enabled: true },
                  }));

                packagesService
                  .setPackageEntitlements(entity.id, entitlements)
                  .catch(() => undefined)
                  .finally(() => {
                    onPackageSaved(entity, { created: false });
                    onClose();
                  });
              })
              .catch(() => {
                onClose();
              });
          }
        }, 1000);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save subscription package"));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl shadow-[0_22px_60px_-45px_rgba(15,23,42,0.65)] ring-1 ring-black/5 dark:ring-white/10 max-w-4xl w-full max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/15 via-indigo-500/10 to-sky-500/10 ring-1 ring-purple-500/10 flex items-center justify-center mr-3">
              <Package className="h-5 w-5 text-purple-700" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {isCreateMode ? "Create Package" : "Edit Package"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-green-700">Package saved successfully!</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Subtype *
              </label>
              <select
                name="productSubtypeId"
                value={formData.productSubtypeId}
                onChange={handleInputChange}
                disabled={optionsLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50"
                required
              >
                <option value="" disabled>
                  {optionsLoading ? "Loading subtypes..." : "Select a subtype"}
                </option>
                {subtypes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {(s.product?.name ? `${s.product.name} — ` : "") + s.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Pick which product this package belongs to (Qbank, MedPrepAI, etc.).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Package Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price === "" ? "" : formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setQuoteLoading(true);
                        const entitlements = Object.entries(selectedEntitlements)
                          .filter(([, v]) => v.enabled)
                          .map(([entitlementDefinitionId, v]) => {
                            const def = entitlementDefs.find((d) => d.id === entitlementDefinitionId);
                            return def
                              ? { key: def.key, valueJson: v.valueJson ?? { enabled: true } }
                              : null;
                          })
                          .filter(Boolean) as Array<{ key: string; valueJson?: any }>;

                        const resp = await packagesService.getPricingQuote({
                          validityDays: Math.max(
                            1,
                            Math.floor(Number(formData.validityDays) || 30)
                          ),
                          currency: formData.currency,
                          entitlements,
                        });
                        setQuote(resp);
                        if (resp?.total != null) {
                          setFormData((prev) => ({ ...prev, price: Number(resp.total) }));
                        }
                      } catch (e) {
                        setError(getApiErrorMessage(e, "Failed to calculate price quote"));
                      } finally {
                        setQuoteLoading(false);
                      }
                    }}
                    disabled={quoteLoading}
                    className="text-xs px-3 py-1.5 border border-violet-200 bg-violet-50/80 text-violet-900 rounded-md hover:bg-violet-100 disabled:opacity-50"
                  >
                    {quoteLoading ? "Calculating…" : "Price from entitlements"}
                  </button>
                  <span className="text-xs text-gray-500">
                    Uses your selections below (requires backend pricing rules).
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency *
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Validity Days *
              </label>
              <input
                type="number"
                name="validityDays"
                value={
                  formData.validityDays === "" ? "" : formData.validityDays
                }
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Active
              </label>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-900">
                  What&apos;s included
                </label>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                  Turn features on or off. Use the fields below for quotas, billing periods, and
                  MedPrep modes — no JSON required for normal setup.
                </p>
                {!hasAtLeastOneIncluded &&
                  visibleEntitlementsForSubtype.length > 0 && (
                    <p
                      className="mt-2 text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200 rounded-md px-3 py-2"
                      role="status"
                    >
                      Select at least one feature below — Create / Update stays disabled until you
                      include something in this package.
                    </p>
                  )}
              </div>

              {entitlementDefs.length === 0 ? (
                <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  No entitlements defined yet. Add them under{" "}
                  <span className="font-medium">Subscriptions → Entitlements</span>.
                </div>
              ) : (
                <div className="space-y-2">
                  {entitlementDefs
                    .filter(
                      (d) =>
                        !d.productSubtypeId ||
                        d.productSubtypeId === formData.productSubtypeId
                    )
                    .map((d) => {
                      const selected = !!selectedEntitlements[d.id]?.enabled;
                      const valueJson =
                        selectedEntitlements[d.id]?.valueJson ?? { enabled: true };
                      const typeHint =
                        ENTITLEMENT_TYPE_HINT[d.type] ?? d.type;
                      const defaultLimit =
                        typeof valueJson?.limit === "number"
                          ? valueJson.limit
                          : typeof valueJson?.limit === "string"
                            ? parseInt(valueJson.limit, 10) || 50
                            : 50;
                      const quotaPeriod = normalizeQuotaPeriod(valueJson?.period);

                      return (
                        <div
                          key={d.id}
                          className="rounded-xl border border-gray-200/90 bg-white/80 dark:bg-white/[0.03] p-3 sm:p-4 shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={selected}
                              title={d.key}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setSelectedEntitlements((prev) => {
                                  const next = { ...prev };
                                  if (!checked) {
                                    delete next[d.id];
                                    return next;
                                  }
                                  let initialJson: Record<string, unknown> = {
                                    enabled: true,
                                  };
                                  if (d.type === "NUMBER_LIMIT") {
                                    const prevLimit = prev[d.id]?.valueJson as
                                      | { limit?: unknown; period?: unknown }
                                      | undefined;
                                    const lim =
                                      typeof prevLimit?.limit === "number"
                                        ? prevLimit.limit
                                        : 50;
                                    initialJson = {
                                      enabled: true,
                                      limit: lim,
                                      period: normalizeQuotaPeriod(prevLimit?.period),
                                    };
                                  }
                                  if (d.type === "SET") {
                                    const prevFull = prev[d.id]?.valueJson as
                                      | { items?: unknown; limitsPerMode?: unknown; limitPeriod?: unknown }
                                      | undefined;
                                    initialJson = {
                                      enabled: true,
                                      items: Array.isArray(prevFull?.items)
                                        ? prevFull.items
                                        : [],
                                      ...(d.key === "medprepai.modes"
                                        ? {
                                            limitsPerMode:
                                              prevFull?.limitsPerMode &&
                                              typeof prevFull.limitsPerMode === "object"
                                                ? prevFull.limitsPerMode
                                                : {},
                                            limitPeriod:
                                              typeof prevFull?.limitPeriod === "string"
                                                ? prevFull.limitPeriod
                                                : "MONTH",
                                          }
                                        : {}),
                                    };
                                  }
                                  next[d.id] = {
                                    enabled: true,
                                    valueJson:
                                      prev[d.id]?.valueJson ?? initialJson,
                                  };
                                  return next;
                                });
                              }}
                              className="mt-1 h-4 w-4 shrink-0 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <div>
                                  <div
                                    className="font-medium text-gray-900 leading-snug"
                                    title={d.key}
                                  >
                                    {d.displayName}
                                  </div>
                                  {d.description ? (
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                      {d.description}
                                    </p>
                                  ) : null}
                                </div>
                                <span
                                  className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0"
                                  title={d.type}
                                >
                                  {typeHint}
                                </span>
                              </div>

                              {selected && d.type === "NUMBER_LIMIT" && (
                                <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                      Max uses
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      value={defaultLimit}
                                      onChange={(e) => {
                                        const v = parseInt(e.target.value, 10);
                                        setSelectedEntitlements((prev) => ({
                                          ...prev,
                                          [d.id]: {
                                            enabled: true,
                                            valueJson: {
                                              enabled: true,
                                              limit: Number.isFinite(v) ? v : 0,
                                              period: normalizeQuotaPeriod(
                                                prev[d.id]?.valueJson?.period
                                              ),
                                            },
                                          },
                                        }));
                                      }}
                                      className="w-28 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-900"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                      Per
                                    </label>
                                    <select
                                      value={quotaPeriod}
                                      onChange={(e) => {
                                        const period =
                                          e.target.value === "MONTH" ? "MONTH" : "DAY";
                                        setSelectedEntitlements((prev) => ({
                                          ...prev,
                                          [d.id]: {
                                            enabled: true,
                                            valueJson: {
                                              enabled: true,
                                              limit: defaultLimit,
                                              period,
                                            },
                                          },
                                        }));
                                      }}
                                      className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 min-w-[140px]"
                                    >
                                      <option value="DAY">Day (resets each day)</option>
                                      <option value="MONTH">Month (resets each month)</option>
                                    </select>
                                  </div>
                                </div>
                              )}

                              {selected && d.type === "SET" && (
                                <SetEntitlementValueEditor
                                  definitionKey={d.key}
                                  valueJson={
                                    (valueJson && typeof valueJson === "object"
                                      ? valueJson
                                      : {}) as Record<string, unknown>
                                  }
                                  onChange={(next) =>
                                    setSelectedEntitlements((prev) => ({
                                      ...prev,
                                      [d.id]: { enabled: true, valueJson: next },
                                    }))
                                  }
                                />
                              )}

                              {selected && d.type === "JSON_CONSTRAINTS" && (
                                <details className="group pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                                  <summary className="text-xs font-medium text-purple-700 dark:text-purple-300 cursor-pointer list-none flex items-center gap-1 [&::-webkit-details-marker]:hidden">
                                    <span className="underline-offset-2 group-open:underline">
                                      Advanced configuration (JSON)
                                    </span>
                                    <span className="text-gray-400 font-normal">
                                      — only if your team provided a schema
                                    </span>
                                  </summary>
                                  <textarea
                                    value={JSON.stringify(valueJson, null, 2)}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      setSelectedEntitlements((prev) => {
                                        const next = { ...prev };
                                        try {
                                          next[d.id] = {
                                            enabled: true,
                                            valueJson: JSON.parse(raw || "{}"),
                                          };
                                        } catch {
                                          /* wait for valid JSON */
                                        }
                                        return next;
                                      });
                                    }}
                                    rows={5}
                                    spellCheck={false}
                                    className="mt-2 w-full font-mono text-[11px] leading-relaxed px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-slate-50/80 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  />
                                </details>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {quote && (
                <div className="mt-4 rounded-md border border-purple-200 bg-purple-50 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-purple-900">
                      Quote preview
                    </div>
                    <div className="text-sm font-bold text-purple-900">
                      {quote.currency} {Number(quote.total).toFixed(2)}
                    </div>
                  </div>
                  {Array.isArray(quote.lineItems) && quote.lineItems.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-purple-900/80">
                      {quote.lineItems.map((li: any, idx: number) => (
                        <li key={idx} className="flex items-center justify-between gap-3">
                          <span className="truncate">{li.label || li.key}</span>
                          <span className="shrink-0">{Number(li.amount).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {quote.discount > 0 && (
                    <div className="mt-2 text-xs text-purple-900/80 flex justify-between">
                      <span>Discount</span>
                      <span>-{Number(quote.discount).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !hasAtLeastOneIncluded}
              title={
                !hasAtLeastOneIncluded
                  ? "Select at least one feature under What's included"
                  : undefined
              }
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isCreateMode ? "Create" : "Update"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

