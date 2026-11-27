import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "../hooks/usePWAInstall";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-4 z-50 inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-[var(--parlo-surface-solid)] px-3.5 py-2 text-xs font-medium text-[var(--parlo-ink)] shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
      <span>Offline mode — Phrasebook &amp; cached data remain available.</span>
    </div>
  );
}
