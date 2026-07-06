"use client";

import React, { useCallback, useEffect, useState } from "react";
import { billingService, BillingPromotion, BillingPromotionType } from "@/app/services/billing/billing.service";
import { useBillingPlans } from "@/hooks/useBilling";
import { Plus, Copy, Archive, Loader2 } from "lucide-react";
import { useConfirm } from "@/hooks/useConfirm";

const PROMO_TYPES: { value: BillingPromotionType; label: string }[] = [
  { value: "PERCENTAGE", label: "Percentage off" },
  { value: "FIXED_AMOUNT", label: "Fixed amount off" },
  { value: "FREE_FIRST_CYCLE", label: "Free first cycle" },
  { value: "MULTI_CYCLE_PERCENTAGE", label: "Multi-cycle %" },
  { value: "LIFETIME_PERCENTAGE", label: "Lifetime %" },
];

const emptyForm: Partial<BillingPromotion> = {
  code: "",
  name: "",
  description: "",
  type: "PERCENTAGE",
  percentOff: 100,
  maxRedemptionsPerUser: 1,
  firstTimeOnly: true,
  isActive: true,
};

export default function PromotionManagement() {
  const { confirm } = useConfirm();
  const { plans } = useBillingPlans(false);
  const [promotions, setPromotions] = useState<BillingPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<BillingPromotion> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await billingService.getPromotions(
        search ? { search } : undefined
      );
      setPromotions(res.data);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!editing?.code) return;
    setSaving(true);
    try {
      if (editing.id) {
        await billingService.updatePromotion(editing.id, editing);
      } else {
        await billingService.createPromotion(editing);
      }
      setEditing(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Promotions</h1>
          <p className="text-sm text-slate-500">Manage discount codes and campaigns</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ ...emptyForm })}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Create promotion
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by code or name..."
        className="w-full max-w-md rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Discount</th>
              <th className="px-4 py-3 font-medium">Used</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </td>
              </tr>
            ) : promotions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  No promotions yet
                </td>
              </tr>
            ) : (
              promotions.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono font-semibold">{p.code}</td>
                  <td className="px-4 py-3">{p.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{p.type.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">
                    {p.type === "FIXED_AMOUNT"
                      ? `$${Number(p.amountOff ?? 0).toFixed(2)}`
                      : `${Number(p.percentOff ?? 0)}%`}
                  </td>
                  <td className="px-4 py-3">
                    {p.redemptionCount}
                    {p.maxRedemptions != null ? ` / ${p.maxRedemptions}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(p)}
                        className="text-emerald-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await billingService.duplicatePromotion(p.id);
                          load();
                        }}
                        className="text-slate-600 hover:underline inline-flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" /> Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await confirm({
                            title: "Archive promotion?",
                            message: "This code will no longer be available for new redemptions.",
                            confirmText: "Archive",
                            variant: "warning",
                          });
                          if (!ok) return;
                          await billingService.archivePromotion(p.id);
                          load();
                        }}
                        className="text-red-600 hover:underline inline-flex items-center gap-1"
                      >
                        <Archive className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">{editing.id ? "Edit promotion" : "Create promotion"}</h2>
            <div className="mt-4 space-y-3">
              <input
                placeholder="Code (e.g. BETA100)"
                value={editing.code ?? ""}
                onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                className="w-full rounded-xl border px-3 py-2 text-sm uppercase"
              />
              <input
                placeholder="Internal name"
                value={editing.name ?? ""}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Description"
                value={editing.description ?? ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
              <select
                value={editing.type ?? "PERCENTAGE"}
                onChange={(e) =>
                  setEditing({ ...editing, type: e.target.value as BillingPromotionType })
                }
                className="w-full rounded-xl border px-3 py-2 text-sm"
              >
                {PROMO_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {(editing.type === "PERCENTAGE" ||
                editing.type === "MULTI_CYCLE_PERCENTAGE" ||
                editing.type === "LIFETIME_PERCENTAGE") && (
                <input
                  type="number"
                  placeholder="Percent off"
                  value={editing.percentOff ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, percentOff: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />
              )}
              {editing.type === "FIXED_AMOUNT" && (
                <input
                  type="number"
                  placeholder="Amount off"
                  value={editing.amountOff ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, amountOff: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />
              )}
              <input
                type="number"
                placeholder="Max total redemptions"
                value={editing.maxRedemptions ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, maxRedemptions: Number(e.target.value) || undefined })
                }
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Max per user"
                value={editing.maxRedemptionsPerUser ?? 1}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    maxRedemptionsPerUser: Number(e.target.value) || 1,
                  })
                }
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.firstTimeOnly ?? false}
                  onChange={(e) =>
                    setEditing({ ...editing, firstTimeOnly: e.target.checked })
                  }
                />
                First-time subscribers only
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.isActive ?? true}
                  onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                />
                Active
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
