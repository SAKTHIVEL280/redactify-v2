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
        <div className="flex-1 h-full w-full flex items-center justify-center p-6 bg-warm-bone text-charcoal">
          <div className="max-w-lg w-full bg-paper-white border border-stone-mist rounded-card p-6 sm:p-8 shadow-card text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-serif font-normal text-charcoal tracking-tight">
              Document Rendering Interrupted
            </h2>

            <p className="text-xs text-bark-grey mt-2 leading-relaxed font-sans">
              Your document remains safe in private local memory. Redactify encountered an unexpected condition while parsing or rendering graphics.
            </p>

            <div className="mt-4 p-3.5 bg-soft-cream border border-stone-mist rounded-button text-left">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 mb-1">
                Diagnostic Trace
              </div>
              <p className="text-xs font-mono text-charcoal break-words line-clamp-3">
                {errorMsg}
              </p>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 rounded-button bg-charcoal hover:bg-black text-white text-xs font-mono font-medium transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Home</span>
              </button>

              <button
                onClick={() => this.setState({ hasError: false })}
                className="py-2.5 px-4 rounded-button bg-soft-cream hover:bg-stone-mist/40 text-charcoal text-xs font-mono font-medium transition-all border border-stone-mist flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>

            <div className="mt-5 text-center">
              <button
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="text-[11px] font-mono text-bark-grey hover:text-charcoal inline-flex items-center gap-1 transition-colors"
              >
                <Bug className="w-3.5 h-3.5" />
                <span>{this.state.showDetails ? 'Hide details' : 'View full error details'}</span>
              </button>

              {this.state.showDetails && (
                <pre className="mt-3 p-3 bg-soft-cream text-left text-[10px] font-mono text-charcoal overflow-x-auto rounded-button border border-stone-mist max-h-40">
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
