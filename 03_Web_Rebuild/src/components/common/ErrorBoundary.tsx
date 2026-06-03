import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ""
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
          <div className="p-8 bg-red-900/50 rounded-lg border border-red-500 shadow-2xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-red-300">系统崩溃</h2>
            <p className="mb-4">捕捉到未处理的异常：</p>
            <pre className="bg-black/50 p-4 rounded text-sm text-red-200 overflow-auto">
              {this.state.errorMsg}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 w-full py-2 bg-red-600 hover:bg-red-500 rounded text-white font-bold transition"
            >
              重启系统
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
