export type AiBadgeStatus = 'ok' | 'cached' | 'fallback';

const labels: Record<AiBadgeStatus, (offlineText: string) => string> = {
  ok: () => 'Gemini',
  cached: () => 'Đã lưu',
  fallback: offlineText => `AI offline – ${offlineText}`,
};

/** Neutral status chip next to an AI feature. Never shows raw fallback reasons; offline is a normal state, so it is not red. */
export function AiStatusBadge({ status, offlineText }: { status: AiBadgeStatus; offlineText: string }) {
  return <span className={`ai-badge is-${status}`} data-ai-status={status}>{labels[status](offlineText)}</span>;
}
