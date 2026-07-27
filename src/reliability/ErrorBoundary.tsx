import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('💥 [REACT ERROR BOUNDARY CAUGHT ERROR]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReloadPage = () => {
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] w-full p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-center my-4 animate-fade-in">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
            {this.props.fallbackTitle || 'Component Error Recovered'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-4 leading-relaxed">
            An unexpected visual rendering issue occurred in this section. Rest assured, your data is safe.
          </p>
          {this.state.error && (
            <div className="w-full max-w-lg mb-4 p-3 bg-red-500/5 border border-red-500/10 rounded-lg text-left text-[11px] font-mono text-red-600 dark:text-red-400 overflow-x-auto max-h-24">
              {this.state.error.message}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Component
            </button>
            <button
              onClick={this.handleReloadPage}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-all flex items-center gap-2 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
