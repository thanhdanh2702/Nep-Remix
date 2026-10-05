import { Component, type ReactNode } from 'react';

/** Keeps one broken screen (e.g. a missing asset path) from blanking the whole app. */
export class ErrorBoundary extends Component<{ children: ReactNode; onReset?: () => void; resetKey?: unknown }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error(error); }
  componentDidUpdate(previous: { resetKey?: unknown }) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) this.setState({ error: null });
  }
  render() {
    if (!this.state.error) return this.props.children;
    return <div className="error-panel" role="alert">
      <h2>Tiệm đang bày lại khu này</h2>
      <p>Có một món đồ chưa tải được. Tiến trình của bạn vẫn được giữ nguyên.</p>
      {this.props.onReset && <button className="primary" onClick={() => { this.setState({ error: null }); this.props.onReset?.(); }}>Về sân nhà</button>}
    </div>;
  }
}
