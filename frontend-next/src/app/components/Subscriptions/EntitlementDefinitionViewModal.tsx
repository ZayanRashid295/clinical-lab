import React, { useEffect } from "react";
import { X, ShieldCheck, CheckCircle, XCircle } from "lucide-react";
import { EntitlementDefinition } from "../../types/subscription";

interface EntitlementDefinitionViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  definition: EntitlementDefinition | null;
}

export default function EntitlementDefinitionViewModal({
  isOpen,
  onClose,
  definition,
}: EntitlementDefinitionViewModalProps) {
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

  if (!isOpen || !definition) return null;

  const badge = definition.isActive ? (
    <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
      <CheckCircle className="h-4 w-4" /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-semibold">
      <XCircle className="h-4 w-4" /> Inactive
    </span>
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl shadow-[0_22px_60px_-45px_rgba(15,23,42,0.65)] ring-1 ring-black/5 dark:ring-white/10 max-w-3xl w-full max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500/15 via-sky-500/10 to-purple-500/10 ring-1 ring-indigo-500/10 flex items-center justify-center mr-3">
              <ShieldCheck className="h-5 w-5 text-indigo-700" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Entitlement Details
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{definition.displayName}</h3>
              <p className="mt-1 text-sm text-gray-600 font-mono">{definition.key}</p>
              {definition.description && (
                <p className="mt-2 text-gray-700">{definition.description}</p>
              )}
            </div>
            <div>{badge}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <div className="text-xs font-semibold text-gray-500">Type</div>
              <div className="text-sm font-semibold text-gray-900">{definition.type}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500">Scope</div>
              <div className="text-sm font-semibold text-gray-900">
                {definition.productSubtype?.name || "Global"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

