import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft, Bug } from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Redactify ErrorBoundary caught an exception:', error, errorInfo);
  }

  handleReset = () => {
    try {
      useDocumentStore.getState().setFile(null, null);
    } catch (e) {
      console.warn('Failed to reset store:', e);
    }
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || 'An unexpected client-side error occurred.';

      return (
        <div className="flex-1 h-full w-full flex items-center justify-center p-6 bg-zinc-950 text-zinc-100">
          <div className="max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-5">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-black text-white tracking-tight">
              Document Rendering Interrupted
            </h2>

            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Your document remains safe in private local memory. Redactify encountered an unexpected condition while parsing or rendering graphics.
            </p>

            <div className="mt-4 p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-2xl text-left">
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1">
                Diagnostic Trace
              </div>
              <p className="text-xs font-mono text-zinc-300 break-words line-clamp-3">
                {errorMsg}
              </p>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-md shadow-rose-950/60 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Home</span>
              </button>

              <button
                onClick={() => this.setState({ hasError: false })}
                className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-all border border-zinc-700/50 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>

            <div className="mt-5 text-center">
              <button
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="text-[11px] text-zinc-500 hover:text-zinc-400 inline-flex items-center gap-1 transition-colors"
              >
                <Bug className="w-3.5 h-3.5" />
                <span>{this.state.showDetails ? 'Hide details' : 'View full error details'}</span>
              </button>

              {this.state.showDetails && (
                <pre className="mt-3 p-3 bg-zinc-950 text-left text-[10px] font-mono text-zinc-400 overflow-x-auto rounded-xl border border-zinc-800 max-h-40">
                  {this.state.error?.stack || String(this.state.error)}
                  {this.state.errorInfo?.componentStack}
                </pre>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
