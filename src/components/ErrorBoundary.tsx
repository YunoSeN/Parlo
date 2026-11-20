import { Component, ErrorInfo, ReactNode } from "react";
import { RotateCcw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || "An unexpected studio error occurred.",
    };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Parlo ErrorBoundary caught an error:", error, info);
  }

  private handleReload = () => {
    this.setState({ hasError: false, errorMessage: null });
    window.location.reload();
  };

  private handleResetView = () => {
    this.setState({ hasError: false, errorMessage: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--parlo-canvas)] text-[var(--parlo-ink)] px-6 py-12">
          <div className="max-w-md w-full rounded-2xl border border-[var(--parlo-border)] bg-[var(--parlo-surface)] p-6 sm:p-8 text-center shadow-xl">
            <p className="font-tech text-[10px] uppercase tracking-[0.22em] text-[var(--parlo-primary)] font-semibold">
              Parlo Studio Recovery
            </p>
            <h1 className="mt-2 font-serif-editorial text-2xl sm:text-3xl font-medium text-[var(--parlo-ink)]">
              Something interrupted your session
            </h1>
            <p className="mt-2.5 text-sm text-[var(--parlo-ink-secondary)] leading-relaxed">
              Your saved phrases, streaks, and settings are safe. You can resume right away or refresh the studio.
            </p>
            {this.state.errorMessage && (
              <p className="mt-3 px-3 py-2 rounded-lg bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] font-mono text-[11px] text-[var(--parlo-ink-muted)] break-words">
                {this.state.errorMessage}
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={this.handleResetView}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-[var(--parlo-border)] bg-[var(--parlo-surface-alt)] text-[var(--parlo-ink)] hover:border-[var(--parlo-primary)] transition-colors cursor-pointer"
              >
                Try Resuming
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--parlo-primary)] text-[var(--parlo-on-solid)] hover:bg-[var(--parlo-primary-hover)] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Reload Parlo
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
