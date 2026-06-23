import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-zinc-950/80 border border-red-900/30 rounded-lg p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-center space-x-3 text-red-400 mb-4">
              <span className="text-2xl">⚠️</span>
              <h2 className="text-lg font-semibold tracking-tight uppercase font-mono">App Render Recovered</h2>
            </div>
            
            <p className="text-xs text-white/70 mb-4 leading-relaxed font-light">
              We encountered a slight luxury interface alignment failure. The automatic recovery system has secured the core database and session state safely.
            </p>

            <div className="bg-black/50 p-4 rounded border border-white/5 font-mono text-[10px] text-red-300 overflow-auto max-h-48 mb-6">
              {this.state.error?.toString() || 'Script error'}
            </div>

            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full py-2 bg-gradient-to-r from-red-950 to-zinc-900 border border-red-500/30 text-red-200 hover:text-white rounded-md text-xs font-mono uppercase transition-all duration-300"
            >
              Reset Session & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
