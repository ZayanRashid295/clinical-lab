"use client";

import React, { useState } from "react";
import { billingService, BillingPlan, PlanFeature } from "@/app/services/billing/billing.service";
import { useBillingPlans } from "@/hooks/useBilling";

const EMPTY_PLAN: Partial<BillingPlan> = {
  name: "",
  description: "",
  monthlyPrice: 0,
  yearlyPrice: 0,
  currency: "USD",
  trialEnabled: true,
  trialDurationDays: 14,
  featuresJson: [],
  displayOrder: 0,
  isPopular: false,
  isActive: true,
  isPublic: true,
  isDefault: false,
};

export default function BillingPlanManagement() {
  const { plans, loading } = useBillingPlans(false);
  const [editing, setEditing] = useState<Partial<BillingPlan> | null>(null);
  const [featureKey, setFeatureKey] = useState("");
  const [featureName, setFeatureName] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = () => window.location.reload();

  const handleSave = async () => {
    if (!editing?.name) return;
    setSaving(true);
    try {
      if (editing.id) {
        await billingService.updatePlan(editing.id, editing);
      } else {
        await billingService.createPlan(editing);
      }
      setEditing(null);
      refresh();
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => {
    if (!featureKey || !featureName || !editing) return;
    const features = [...(editing.featuresJson ?? []), { key: featureKey, name: featureName, enabled: true }];
    setEditing({ ...editing, featuresJson: features as PlanFeature[] });
    setFeatureKey("");
    setFeatureName("");
  };

  if (loading) return <div className="p-8 text-center">Loading plans...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subscription Plans</h1>
        <button
          onClick={() => setEditing({ ...EMPTY_PLAN })}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
        >
          Create Plan
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Monthly</th>
              <th className="p-3">Yearly</th>
              <th className="p-3">Trial</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id} className="border-t">
                <td className="p-3 font-medium">
                  {plan.name}
                  {plan.isPopular && <span className="ml-2 text-xs text-emerald-600">★ Popular</span>}
                  {plan.isDefault && <span className="ml-2 text-xs text-gray-500">Default</span>}
                </td>
                <td className="p-3">${Number(plan.monthlyPrice).toFixed(2)}</td>
                <td className="p-3">${Number(plan.yearlyPrice).toFixed(2)}</td>
                <td className="p-3">
                  {plan.trialEnabled ? `${plan.trialDurationDays} days` : "—"}
                </td>
                <td className="p-3">{plan.isActive ? "Active" : "Inactive"}</td>
                <td className="p-3">
                  <button
                    onClick={() => setEditing(plan)}
                    className="text-emerald-600 hover:underline"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">{editing.id ? "Edit Plan" : "Create Plan"}</h2>
            <div className="space-y-3">
              <input
                placeholder="Plan name"
                value={editing.name ?? ""}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full rounded border px-3 py-2"
              />
              <textarea
                placeholder="Description"
                value={editing.description ?? ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="w-full rounded border px-3 py-2"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Monthly price"
                  value={editing.monthlyPrice ?? 0}
                  onChange={(e) => setEditing({ ...editing, monthlyPrice: Number(e.target.value) })}
                  className="rounded border px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Yearly price"
                  value={editing.yearlyPrice ?? 0}
                  onChange={(e) => setEditing({ ...editing, yearlyPrice: Number(e.target.value) })}
                  className="rounded border px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editing.trialEnabled ?? false}
                    onChange={(e) => setEditing({ ...editing, trialEnabled: e.target.checked })}
                  />
                  Trial enabled
                </label>
                <input
                  type="number"
                  placeholder="Trial days"
                  value={editing.trialDurationDays ?? 0}
                  onChange={(e) => setEditing({ ...editing, trialDurationDays: Number(e.target.value) })}
                  className="rounded border px-3 py-2"
                />
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.isPopular ?? false}
                    onChange={(e) => setEditing({ ...editing, isPopular: e.target.checked })}
                  />
                  Popular badge
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.isActive ?? true}
                    onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.isPublic ?? true}
                    onChange={(e) => setEditing({ ...editing, isPublic: e.target.checked })}
                  />
                  Public
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.isDefault ?? false}
                    onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })}
                  />
                  Default plan
                </label>
              </div>
              <div className="border-t pt-3">
                <p className="mb-2 text-sm font-medium">Features</p>
                <div className="flex gap-2">
                  <input
                    placeholder="Feature key"
                    value={featureKey}
                    onChange={(e) => setFeatureKey(e.target.value)}
                    className="flex-1 rounded border px-2 py-1 text-sm"
                  />
                  <input
                    placeholder="Display name"
                    value={featureName}
                    onChange={(e) => setFeatureName(e.target.value)}
                    className="flex-1 rounded border px-2 py-1 text-sm"
                  />
                  <button type="button" onClick={addFeature} className="rounded bg-gray-100 px-2 text-sm">
                    Add
                  </button>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  {(editing.featuresJson ?? []).map((f: PlanFeature) => (
                    <li key={f.key}>{f.name} ({f.key})</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded border px-4 py-2 text-sm">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-50"
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
