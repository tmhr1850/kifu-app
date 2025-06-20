'use client';

import React, { Component, ReactNode } from 'react';
import { captureException } from '@/utils/monitoring';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    captureException(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                😢 エラー発生しちゃった...
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                ごめん！なんかエラー出ちゃった💦<br />
                でも大丈夫！一緒に解決しよう✨
              </p>
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <p className="text-sm text-red-800 font-mono">
                  {this.state.error.message}
                </p>
              </div>
              <button
                onClick={this.resetError}
                className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                もう一回トライする！💪
              </button>
              <p className="text-sm text-gray-500 mt-4">
                それでもダメなら、ページをリロードしてみて！
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;