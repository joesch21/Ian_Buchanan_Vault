import React from "react";

export class ErrorBoundary extends React.Component<React.PropsWithChildren, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(e: any, info: any) {
    console.error("Know crashed", e, info);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("know_disabled", "1");
      } catch {
        // ignore
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return <div className="know-error">Something went wrong.</div>;
    }
    return this.props.children;
  }
}

