import { useEffect, useRef } from "react";
import type { UIConfig } from "../../app/config/ui.config";
import { authService } from "../services/auth.service";
import { configToServerPatchBody } from "../utils/ui-preferences-sync";

const PERSIST_DEBOUNCE_MS = 800;

/** Debounced sync of UI preferences to the server when signed in. */
export function usePersistUiPreferences(config: UIConfig): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !authService.isAuthenticated()) {
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void authService
        .patchUiPreferences(configToServerPatchBody(config) as Record<string, unknown>)
        .catch(() => undefined);
    }, PERSIST_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [config]);
}
