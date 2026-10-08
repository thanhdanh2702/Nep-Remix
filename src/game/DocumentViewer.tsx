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

  useEffect(() => {
    // Focus the modal or primary button on mount
    const btn = containerRef.current?.querySelector<HTMLButtonElement>('button.primary, button');
    btn?.focus();
  }, [doc.id]);

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
      onClose={readOnly ? onClose : handleAction}
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

        <div className="document-viewer-body">
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
