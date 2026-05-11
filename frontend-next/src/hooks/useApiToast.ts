"use client";

import { useToast } from "@/shared/ui/use-toast";
import {
  toastApiError,
  userFacingApiMessage,
} from "@/app/services/base/api-http-error";

/**
 * Standard hook for surfacing API failures as destructive toasts instead of
 * uncaught {@link ApiHttpError} or raw developer messages.
 */
export function useApiToast() {
  const { toast } = useToast();

  return {
    toast,
    /** Shows a destructive toast with {@link userFacingApiMessage} body. */
    toastApiError: (e: unknown, title?: string) =>
      toastApiError(toast, e, title ?? "Something went wrong"),
    /** Same mapping without toast — for inline copy / form errors. */
    formatApiError: userFacingApiMessage,
  };
}
