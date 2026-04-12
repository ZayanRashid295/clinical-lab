import { useCallback, useMemo } from "react";
import { useConfirm } from "./useConfirm";
import { useToast } from "@/shared/ui/use-toast";

export interface ContentDestructiveOptions<T extends { id: string }> {
  entitySingular: string;
  entityPlural: string;
  deletePermanent: (id: string) => Promise<unknown>;
  refetch: () => void | Promise<void>;
}

/**
 * Shared confirm + toast + refetch handlers for admin content tables
 * (permanent delete + bulk permanent delete). Use edit / isActive for hiding items.
 */
export function useContentManagementDestructiveActions<T extends { id: string }>(
  options: ContentDestructiveOptions<T>
) {
  const { confirm } = useConfirm();
  const { toast } = useToast();

  const { entitySingular, entityPlural, deletePermanent, refetch } = options;

  const onDeletePermanent = useCallback(
    async (item: T) => {
      const ok = await confirm({
        title: `Permanently delete ${entitySingular}?`,
        message: `This cannot be undone. The ${entitySingular} and any dependent data allowed by the server will be removed permanently.`,
        confirmText: "Delete permanently",
        variant: "danger",
      });
      if (!ok) return;
      try {
        await deletePermanent(item.id);
        toast({
          title: "Deleted",
          description: `The ${entitySingular} was permanently removed.`,
        });
        await refetch();
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Could not delete",
          description: e instanceof Error ? e.message : "Request failed",
        });
      }
    },
    [confirm, toast, deletePermanent, refetch, entitySingular]
  );

  const onBulkDeletePermanent = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      const ok = await confirm({
        title: `Delete ${ids.length} ${ids.length === 1 ? entitySingular : entityPlural}?`,
        message: `Permanently remove ${ids.length} selected item(s). This cannot be undone.`,
        confirmText: "Delete all",
        variant: "danger",
      });
      if (!ok) return;
      let failed = 0;
      for (const id of ids) {
        try {
          await deletePermanent(id);
        } catch {
          failed += 1;
        }
      }
      if (failed === 0) {
        toast({
          title: "Deleted",
          description: `Removed ${ids.length} ${ids.length === 1 ? entitySingular : entityPlural}.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Some deletes failed",
          description: `${ids.length - failed} removed, ${failed} failed. Check dependencies or try again.`,
        });
      }
      await refetch();
    },
    [confirm, toast, deletePermanent, refetch, entitySingular, entityPlural]
  );

  return useMemo(
    () => ({
      onDeletePermanent,
      onBulkDeletePermanent,
    }),
    [onDeletePermanent, onBulkDeletePermanent]
  );
}
