import { useEffect, useRef } from 'react';
import { asset, assetRegistry } from './assets';
import { Modal } from './Modal';
import {
  type DocumentContent,
  type DocumentMetadataField,
  C3_DOCUMENTS,
  isC3DocumentDialogue,
  c3DocumentForDialogue,
  c3DocumentForItem,
  c3DocumentForClue,
} from './c3-documents';

export {
  type DocumentContent,
  type DocumentMetadataField,
  C3_DOCUMENTS,
  isC3DocumentDialogue,
  c3DocumentForDialogue,
  c3DocumentForItem,
  c3DocumentForClue,
};

const safeDocAsset = (path: string): string => {
  return assetRegistry[path] ? asset(path) : path;
};

export interface DocumentViewerProps {
  document: DocumentContent;
  dialogueText?: string;
  speaker?: string;
  isReread?: boolean;
  readOnly?: boolean;
  onAdvance?: () => void;
  onClose?: () => void;
}

/**
 * DocumentViewer: Dedicated viewer for Chapter 3 evidence documents.
 * - Active reading mode: Used during scene dialogue interactions; advances via Core dialogue/advance.
 * - Read-only reread mode: Used in Journal/Inventory; allows inspecting documents without mutating state or granting rewards.
 * - Semantic Vietnamese comparative content: Compares Sổ gốc, Thư thỏa thuận, Bản sửa, and Biên nhận without relying on handwriting, paper folds, or good fortune claims.
 */
export interface DocumentScrollTarget {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  style?: { scrollBehavior?: string };
}

/**
 * Pure keyboard scroll handler for DocumentViewer reading region.
 * Handles ArrowDown, ArrowUp, PageDown, PageUp, Home, End.
 * Clamps within [0, scrollHeight - clientHeight].
 * Invokes preventDefault() to prevent outer page / modal scrolling.
 * Bypasses smooth scrolling on key repeat or reduced-motion to prevent animation lag.
 */
export function handleDocumentBodyKeyDown(
  el: DocumentScrollTarget,
  e: { key: string; repeat?: boolean; preventDefault?: () => void },
  prefersReducedMotion = false
): boolean {
  const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
  const scrollStep = 40;
  const pageStep = Math.max(120, Math.round(el.clientHeight * 0.8));

  let delta = 0;
  let targetScroll: number | null = null;

  switch (e.key) {
    case 'ArrowDown':
      delta = scrollStep;
      break;
    case 'ArrowUp':
      delta = -scrollStep;
      break;
    case 'PageDown':
      delta = pageStep;
      break;
    case 'PageUp':
      delta = -pageStep;
      break;
    case 'Home':
      targetScroll = 0;
      break;
    case 'End':
      targetScroll = maxScroll;
      break;
    default:
      return false;
  }

  e.preventDefault?.();

  const nextScroll = targetScroll !== null
    ? targetScroll
    : Math.max(0, Math.min(maxScroll, el.scrollTop + delta));

  const isHtmlEl = typeof HTMLElement !== 'undefined' && el instanceof HTMLElement;
  const isJumpOrRepeat = Boolean(e.key === 'Home' || e.key === 'End' || e.repeat);
  const isReduced = Boolean(
    prefersReducedMotion ||
    (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
  );

  if (isHtmlEl && (isJumpOrRepeat || isReduced) && el.style) {
    const prevBehavior = el.style.scrollBehavior;
    el.style.scrollBehavior = 'auto';
    el.scrollTop = nextScroll;
    el.style.scrollBehavior = prevBehavior;
  } else {
    el.scrollTop = nextScroll;
  }

  return true;
}

export function DocumentViewer({
  document: doc,
  dialogueText,
  speaker,
  isReread = false,
  readOnly = false,
  onAdvance,
  onClose,
}: DocumentViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus the document reading body on mount so keyboard users read the evidence first
    if (bodyRef.current) {
      bodyRef.current.focus();
    } else {
      const btn = containerRef.current?.querySelector<HTMLButtonElement>('button.primary, button');
      btn?.focus();
    }
  }, [doc.id]);

  const handleBodyKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const el = bodyRef.current;
    if (!el) return;
    handleDocumentBodyKeyDown(el, e);
  };

  const handleAction = () => {
    if (readOnly) {
      onClose?.();
    } else {
      onAdvance?.();
    }
  };

  const actionLabel = readOnly
    ? 'Đóng văn bản'
    : isReread
      ? 'Khép văn bản'
      : doc.id === 'doc-c3-so-goc'
        ? 'Đọc tiếp thư thỏa thuận'
        : 'Xác nhận đã đọc';

  return (
    <Modal
      title={doc.title}
      wide
      className="document-viewer-modal"
      onClose={readOnly ? onClose : undefined}
    >
      <div ref={containerRef} className="document-viewer-container" data-testid="document-viewer">
        <header className="document-viewer-header">
          <div className="document-viewer-badges">
            <span className="doc-badge doc-badge-type">Văn bản chứng cứ</span>
            {readOnly ? (
              <span className="doc-badge doc-badge-readonly">Sổ manh mối · Chỉ đọc</span>
            ) : isReread ? (
              <span className="doc-badge doc-badge-reread">Chế độ đọc lại</span>
            ) : (
              <span className="doc-badge doc-badge-active">Đang đối chiếu</span>
            )}
          </div>
          <p className="doc-subtitle">{doc.subtitle}</p>
        </header>

        <div
          ref={bodyRef}
          className="document-viewer-body"
          tabIndex={0}
          role="region"
          aria-label={`Văn bản chứng cứ: ${doc.title}`}
          onKeyDown={handleBodyKeyDown}
        >
          {/* Visual production paper preview */}
          <div className="document-paper-frame">
            <img
              src={safeDocAsset(doc.imagePath)}
              alt={doc.title}
              className="document-paper-img"
              loading="lazy"
            />
          </div>

          {/* Semantic Vietnamese comparative reading area */}
          <div className="document-semantic-panel">
            <div className="doc-metadata-grid">
              {doc.metadata.map((m, idx) => (
                <div key={idx} className="doc-meta-item">
                  <span className="doc-meta-label">{m.label}:</span>
                  <strong className="doc-meta-value">{m.value}</strong>
                </div>
              ))}
            </div>

            <div className="doc-content-section">
              <h4 className="doc-section-title">Nội dung văn bản</h4>
              <p className="doc-main-text">{doc.summaryText}</p>
              <div className="doc-highlight-box">
                <span className="doc-highlight-tag">Điểm then chốt:</span>
                <span className="doc-highlight-content">“{doc.highlightText}”</span>
              </div>
            </div>

            <div className="doc-comparative-section">
              <h4 className="doc-section-title">Ý nghĩa đối chiếu</h4>
              <p className="doc-comparative-text">{doc.comparativeRole}</p>
            </div>

            {/* Active dialogue text if presented during story flow */}
            {!readOnly && dialogueText && (
              <div className="doc-dialogue-excerpt">
                <span className="doc-speaker-tag">{speaker ?? 'Lời kể'}:</span>
                <p className="doc-dialogue-line">{dialogueText}</p>
              </div>
            )}
          </div>
        </div>

        <footer className="document-viewer-footer">
          <p className="doc-notice-text">
            {readOnly
              ? 'Xem lại bản sao lưu không làm thay đổi túi đồ hay tiến trình câu chuyện.'
              : 'Xác nhận đọc để lưu nhận thức vào sổ manh mối và mở tiếp diễn tiến.'}
          </p>
          <div className="doc-actions">
            <button
              type="button"
              className="primary"
              onClick={handleAction}
              data-testid="document-advance-button"
            >
              {actionLabel}
            </button>
          </div>
        </footer>
      </div>
    </Modal>
  );
}
