import { SubscriptionPackage } from "../../types/subscription";

/** Legacy `subscriptionFeatures` + new `entitlements` (admin "What's included"). */
export function includedItemsForPackage(
  pkg: SubscriptionPackage | undefined
): Array<{ id: string; label: string }> {
  if (!pkg) return [];
  const legacy =
    pkg.subscriptionFeatures
      ?.map((f) => ({
        id: `legacy-${f.id}`,
        label: (f.packageFeature?.name || (f as { name?: string }).name || "").trim(),
      }))
      .filter((x) => x.label) ?? [];
  const entitlements =
    pkg.entitlements
      ?.map((e) => ({
        id: `ent-${e.id}`,
        label: (
          e.entitlementDefinition?.displayName ||
          e.entitlementDefinition?.key ||
          ""
        ).trim(),
      }))
      .filter((x) => x.label) ?? [];
  return [...legacy, ...entitlements];
}

export function includedFeatureCount(pkg: SubscriptionPackage): number {
  const legacy = pkg.subscriptionFeatures?.length ?? 0;
  const ents = pkg.entitlements?.length ?? 0;
  return legacy + ents;
}
