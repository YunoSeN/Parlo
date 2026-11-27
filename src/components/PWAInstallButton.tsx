import { useState } from "react";
import { Download, Share, X } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        title="Install Parlo to your home screen for daily practice"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[var(--parlo-border)] bg-[var(--parlo-surface)] text-[var(--parlo-ink-secondary)] hover:text-[var(--parlo-ink)] hover:border-[var(--parlo-primary)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 text-[var(--parlo-primary)]" aria-hidden="true" />
        <span className="hidden lg:inline">Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          title="Add Parlo to your iPhone or iPad Home Screen"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[var(--parlo-border)] bg-[var(--parlo-surface)] text-[var(--parlo-ink-secondary)] hover:text-[var(--parlo-ink)] hover:border-[var(--parlo-primary)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[var(--parlo-primary)]" aria-hidden="true" />
          <span className="hidden sm:inline">Install</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="parlo-ios-install-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-[var(--parlo-border)] bg-[var(--parlo-surface-solid)] p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <h3
                  id="parlo-ios-install-title"
                  className="font-display text-base font-semibold text-[var(--parlo-ink)]"
                >
                  Install Parlo on iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close install instructions"
                  className="p-1 text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] rounded-md cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <ol className="mt-3 space-y-2 text-xs text-[var(--parlo-ink-secondary)] leading-relaxed list-decimal list-inside">
                <li>
                  Tap the{" "}
                  <span className="inline-flex items-center gap-1 font-semibold text-[var(--parlo-ink)]">
                    <Share className="w-3 h-3" aria-hidden="true" />
                    Share
                  </span>{" "}
                  button in Safari&apos;s toolbar.
                </li>
                <li>
                  Scroll down and tap{" "}
                  <strong className="text-[var(--parlo-ink)]">
                    Add to Home Screen
                  </strong>
                  .
                </li>
                <li>
                  Tap <strong className="text-[var(--parlo-ink)]">Add</strong>{" "}
                  to launch Parlo like a native app.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full py-2 text-xs font-semibold rounded-lg bg-[var(--parlo-primary)] text-[var(--parlo-on-solid)] hover:bg-[var(--parlo-primary-hover)] transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
