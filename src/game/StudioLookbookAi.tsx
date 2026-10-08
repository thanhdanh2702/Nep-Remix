import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { StudioDraft } from '../core';
import type { LookbookSuccessResponse, LookbookImage } from '../server/ai/lookbook';
import {
  LOOKBOOK_ANGLES,
  type LookbookAngleId,
  type LookbookCoreState,
  createInitialLookbookState,
  captureLookbookCore,
  retrySingleAngleCore,
  clearLookbookCache,
  getLookbookCacheKey
} from './lookbook-core';
import { content } from './store';
import { asset } from './assets';
import { AiStatusBadge, type AiBadgeStatus } from './AiStatusBadge';
import './studio-ai.css';

type Mode =
  | { kind: 'pixel' }
  | { kind: 'loading' }
  | { kind: 'ai'; status: AiBadgeStatus; data: LookbookSuccessResponse };

const safeImage = (url: unknown): url is string =>
  typeof url === 'string' &&
  (url.startsWith('data:image/') || (url.startsWith('/') && !url.startsWith('//')));

export interface StudioLookbookAiProps {
  draft: StudioDraft;
  eventTitle: string;
  children: ReactNode;
  actions: ReactNode;
  isModalOpen?: boolean;
  captureCount?: number;
  onCloseModal?: () => void;
  onOpenModal?: () => void;
}

/**
 * StudioLookbookAi:
 * - Side panel: Displays the 4 live pixel portraits by default; swaps in 4 AI photos on request.
 * - Lookbook Modal: Displays the full 1144x1375 target frame with real HTML elements,
 *   individual angle streaming, retry buttons, progress tracking, story narrative, and download.
 */
export function StudioLookbookAi({
  draft,
  eventTitle,
  children,
  actions,
  isModalOpen = false,
  captureCount = 0,
  onCloseModal,
  onOpenModal
}: StudioLookbookAiProps) {
  const [mode, setMode] = useState<Mode>({ kind: 'pixel' });
  const [offline, setOffline] = useState(false);
  const [coreState, setCoreState] = useState<LookbookCoreState>(() => createInitialLookbookState());
  const [enlargedAngle, setEnlargedAngle] = useState<LookbookAngleId | null>(null);
  const [lastShotCacheKey, setLastShotCacheKey] = useState<string>('');

  const abortRef = useRef<AbortController | null>(null);
  const prevCaptureCountRef = useRef(0);

  const currentCacheKey = getLookbookCacheKey(draft, eventTitle);
  const garment = content.garmentsById.get(draft.garmentId);
  const garmentName = garment?.name ?? 'Áo truyền thống';

  // Cleanup abort controller on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  // When outfit changes, abort in-flight capture and revert side panel to live pixel doll
  useEffect(() => {
    abortRef.current?.abort();
    setMode({ kind: 'pixel' });
  }, [currentCacheKey]);

  // Handle external capture requests (e.g. from the button under An)
  useEffect(() => {
    if (captureCount > prevCaptureCountRef.current) {
      prevCaptureCountRef.current = captureCount;
      startCapture(true);
    }
  }, [captureCount]);

  // Main capture function for full 4-angle shoot
  const startCapture = async (forceBypassCache = false) => {
    abortRef.current?.abort();
    const controller = (abortRef.current = new AbortController());
    setMode({ kind: 'loading' });

    if (forceBypassCache) {
      clearLookbookCache(draft, eventTitle);
    }

    try {
      const finalState = await captureLookbookCore(
        draft,
        eventTitle,
        {
          onStateChange: (updated) => {
            // A superseded capture must not overwrite the state of the one that replaced it
            if (controller.signal.aborted) return;
            setCoreState(updated);
            // Synchronize side-panel with any completed images as they stream in
            const completedImgs = Object.values(updated.angles)
              .filter((a) => a.status === 'completed' && safeImage(a.imageUrl))
              .map((a) => ({
                angle: a.id,
                angleLabel: a.label,
                imageUrl: a.imageUrl!
              }));

            if (completedImgs.length > 0) {
              setMode({
                kind: 'ai',
                status: updated.aiBadge,
                data: {
                  images: completedImgs,
                  watermark: updated.watermark || 'Ảnh do AI tạo - Tiệm May Nếp 2026',
                  disclosure: updated.disclosure || 'Bộ ảnh được mô phỏng bằng Google Gemini.',
                  story: updated.story
                }
              });
            }
          }
        },
        controller.signal
      );

      if (controller.signal.aborted) return;

      setLastShotCacheKey(currentCacheKey);

      const successfulImages: LookbookImage[] = Object.values(finalState.angles)
        .filter((a) => a.status === 'completed' && safeImage(a.imageUrl))
        .map((a) => ({
          angle: a.id,
          angleLabel: a.label,
          imageUrl: a.imageUrl!
        }));

      if (finalState.status === 'fallback' || successfulImages.length === 0) {
        setOffline(true);
        setMode({ kind: 'pixel' });
      } else {
        setOffline(false);
        setMode({
          kind: 'ai',
          status: finalState.aiBadge,
          data: {
            images: successfulImages,
            watermark: finalState.watermark || 'Ảnh do AI tạo - Tiệm May Nếp 2026',
            disclosure: finalState.disclosure || 'Bộ ảnh được mô phỏng bằng Google Gemini.',
            story: finalState.story
          }
        });
      }
    } catch {
      if (controller.signal.aborted) return;
      setOffline(true);
      setMode({ kind: 'pixel' });
    }
  };

  // Re-capture single angle on slot retry click
  const handleRetryAngle = async (angleId: LookbookAngleId) => {
    const controller = new AbortController();
    await retrySingleAngleCore(
      draft,
      eventTitle,
      angleId,
      coreState,
      {
        onStateChange: (updated) => {
          setCoreState(updated);
          const completedImgs = Object.values(updated.angles)
            .filter((a) => a.status === 'completed' && safeImage(a.imageUrl))
            .map((a) => ({
              angle: a.id,
              angleLabel: a.label,
              imageUrl: a.imageUrl!
            }));
          if (completedImgs.length > 0) {
            setMode({
              kind: 'ai',
              status: updated.aiBadge,
              data: {
                images: completedImgs,
                watermark: updated.watermark || 'Ảnh do AI tạo - Tiệm May Nếp 2026',
                disclosure: updated.disclosure || 'Bộ ảnh được mô phỏng bằng Google Gemini.',
                story: updated.story
              }
            });
          }
        }
      },
      controller.signal
    );
  };

  // Save all 4 completed images to user device
  const handleDownloadAll = () => {
    const completedAngles = LOOKBOOK_ANGLES.filter(
      (a) => coreState.angles[a.id].status === 'completed' && coreState.angles[a.id].imageUrl
    );
    if (!completedAngles.length) return;

    completedAngles.forEach((angleDef, idx) => {
      const url = coreState.angles[angleDef.id].imageUrl!;
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `lookbook-${angleDef.id}-${draft.garmentId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, idx * 250);
    });
  };

  // Save single photo
  const handleDownloadSingle = (url: string, angleId: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `lookbook-${angleId}-${draft.garmentId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loading = mode.kind === 'loading';
  const ai = mode.kind === 'ai' ? mode : null;

  const outfitChangedSinceLastCapture =
    lastShotCacheKey !== '' && lastShotCacheKey !== currentCacheKey;

  const defaultStory = `Tà ${garmentName} với sắc lụa truyền thống mang đến vẻ đoan trang, rất mực hòa hợp cùng không khí ${eventTitle}. Từng đường kim mũi chỉ tượng trưng cho ước vọng vẹn tròn, lưu giữ cốt cách thanh cao của trang phục Việt.`;

  return (
    <>
      {/* 1. Side Panel Lookbook Board */}
      <div className="studio-lookbook-board">
        <div className="studio-lookbook-art" aria-hidden="true">
          <img
            className="art-hires"
            src={asset('assets/screens/studio/lookbook-frame.png')}
            alt=""
          />
        </div>
        <div className="studio-lookbook-grid">
          {ai
            ? ai.data.images.map((image) => (
                <figure key={image.angle} className="studio-lookbook-card">
                  <div className="studio-lookbook-portrait">
                    <img
                      className="studio-ai-photo"
                      src={image.imageUrl}
                      alt={`${image.angleLabel} - ảnh AI bộ phối ${garmentName}`}
                      loading="lazy"
                    />
                  </div>
                  <figcaption>{image.angleLabel}</figcaption>
                </figure>
              ))
            : children}
        </div>
        <div className="studio-ai-lookbook-status" aria-live="polite">
          {loading && <span>Đang hỏi Gemini…</span>}
          {ai && (
            <>
              <AiStatusBadge status={ai.status} offlineText="ảnh pixel" />
              <span>
                {ai.data.watermark}. {ai.data.disclosure}
              </span>
            </>
          )}
          {offline && !loading && !ai && (
            <AiStatusBadge status="fallback" offlineText="AI offline – dùng ảnh pixel" />
          )}
        </div>
      </div>

      {/* Side Panel Action Buttons */}
      <div
        className="studio-actions"
        role="group"
        aria-label="Lưu và tùy chỉnh bộ phối"
      >
        {actions}
        {ai && (
          <button
            className="studio-ai-capture"
            onClick={() => setMode({ kind: 'pixel' })}
          >
            Về ảnh pixel
          </button>
        )}
      </div>

      {/* 2. Full Lookbook Modal Frame (1144:1375) */}
      {isModalOpen && (
        <div
          className="studio-lookbook-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Khung ảnh Lookbook AI"
        >
          <div className="studio-lookbook-modal-frame">
            {/* Background artwork (1144x1375) */}
            <img
              className="lb-art-frame"
              src={asset('assets/screens/studio/lookbook-frame.png')}
              alt=""
              aria-hidden="true"
            />

            {/* Close Button (top-right X) */}
            <button
              type="button"
              className="lb-close-btn"
              onClick={onCloseModal}
              aria-label="Đóng khung Lookbook"
              title="Đóng"
            >
              ✕
            </button>

            {/* Outfit changed banner notice */}
            {outfitChangedSinceLastCapture && (
              <div className="lb-outfit-change-banner" role="alert">
                <span>
                  Bạn vừa đổi sang <strong>{garmentName}</strong>. Chụp bộ mới này nhé?
                </span>
                <button
                  type="button"
                  className="lb-outfit-change-confirm"
                  onClick={() => startCapture(true)}
                >
                  Chụp bộ này
                </button>
              </div>
            )}

            {/* 4 Photo Slots */}
            <div className="lb-slots-container">
              {LOOKBOOK_ANGLES.map((angleDef) => {
                const angleState = coreState.angles[angleDef.id];
                const isCompleted =
                  angleState.status === 'completed' && Boolean(angleState.imageUrl);
                const isGenerating = angleState.status === 'generating';
                const isError = angleState.status === 'error';

                return (
                  <div
                    key={angleDef.id}
                    className={`lb-slot lb-slot-${angleDef.id} status-${angleState.status}`}
                    onClick={() => {
                      if (isCompleted && angleState.imageUrl) {
                        setEnlargedAngle(angleDef.id);
                      }
                    }}
                    role={isCompleted ? 'button' : undefined}
                    tabIndex={isCompleted ? 0 : undefined}
                    aria-label={
                      isCompleted
                        ? `Phóng to góc ${angleDef.label}`
                        : `Góc ${angleDef.label}`
                    }
                  >
                    {isGenerating && (
                      <div className="lb-slot-generating">
                        <div className="lb-shimmer" />
                        <div className="lb-spinner" aria-hidden="true" />
                        <span className="lb-slot-label">{angleDef.label}</span>
                        <span className="lb-slot-subtext">Đang chụp…</span>
                      </div>
                    )}

                    {isCompleted && angleState.imageUrl && (
                      <div className="lb-slot-completed">
                        <img
                          src={angleState.imageUrl}
                          alt={`${angleDef.label} - ${garmentName}`}
                          className="lb-slot-img"
                        />
                        <span className="lb-slot-badge">{angleDef.label}</span>
                        <div className="lb-slot-hover-hint">Phóng to</div>
                      </div>
                    )}

                    {isError && (
                      <div className="lb-slot-error">
                        <span className="lb-error-icon" aria-hidden="true">
                          ⚠️
                        </span>
                        <span className="lb-slot-label">{angleDef.label}</span>
                        <p className="lb-error-msg">
                          {angleState.error || 'Lỗi chụp góc'}
                        </p>
                        <button
                          type="button"
                          className="lb-retry-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRetryAngle(angleDef.id);
                          }}
                        >
                          ↻ Thử lại
                        </button>
                      </div>
                    )}

                    {!isGenerating && !isCompleted && !isError && (
                      <div className="lb-slot-idle">
                        <span className="lb-slot-label">{angleDef.label}</span>
                        <span className="lb-slot-subtext">Chờ chụp</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress indicator bar */}
            <div className="lb-progress-container" aria-live="polite">
              {coreState.status === 'generating' && (
                <div className="lb-progress-active">
                  <span className="lb-progress-label">
                    Đang chụp {coreState.progress.completed}/4 góc…
                  </span>
                  <div className="lb-progress-track">
                    <div
                      className="lb-progress-bar"
                      style={{
                        width: `${(coreState.progress.completed / 4) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}

              {coreState.status === 'completed' && (
                <div className="lb-progress-done">
                  <AiStatusBadge
                    status={coreState.aiBadge}
                    offlineText="Ảnh phác thảo"
                  />
                  <span className="lb-done-time">
                    {coreState.durationMs
                      ? `Đã chụp xong (${(coreState.durationMs / 1000).toFixed(1)}s)`
                      : 'Đã hoàn thành 4/4 góc'}
                  </span>
                </div>
              )}

              {coreState.status === 'fallback' && (
                <div className="lb-progress-fallback">
                  <AiStatusBadge status="fallback" offlineText="Dự phòng" />
                  <span className="lb-fallback-msg">
                    {coreState.errorMessage || 'AI đang bận hoặc quá thời gian'}
                  </span>
                </div>
              )}

              {coreState.status === 'idle' && (
                <div className="lb-progress-idle">
                  <span>Sẵn sàng ghi lại 4 góc sắc nét cùng Gemini</span>
                </div>
              )}
            </div>

            {/* Two Action Buttons on Frame */}
            <div className="lb-buttons-container">
              <button
                type="button"
                className="lb-frame-btn lb-btn-recapture"
                onClick={() => startCapture(true)}
                disabled={coreState.status === 'generating'}
                aria-label="Chụp lại cả 4 góc"
              >
                Chụp lại
              </button>
              <button
                type="button"
                className="lb-frame-btn lb-btn-save-all"
                onClick={handleDownloadAll}
                disabled={
                  coreState.progress.completed < 4 || coreState.status === 'generating'
                }
                aria-label="Lưu bộ ảnh về máy"
              >
                Lưu bộ ảnh
              </button>
            </div>

            {/* Story Box: "Câu chuyện tà áo" */}
            <div className="lb-story-box">
              {coreState.status === 'generating' ? (
                <div className="lb-story-shimmer" aria-label="Đang dệt ý nghĩa tà áo…">
                  <div className="lb-story-shimmer-line line-1" />
                  <div className="lb-story-shimmer-line line-2" />
                </div>
              ) : (
                <p className="lb-story-text">
                  {coreState.story || defaultStory}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Lightbox zoomed view */}
      {enlargedAngle && (
        <div
          className="lb-lightbox-overlay"
          onClick={() => setEnlargedAngle(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh phóng to"
        >
          <div
            className="lb-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="lb-lightbox-close"
              onClick={() => setEnlargedAngle(null)}
              aria-label="Đóng ảnh phóng to"
            >
              ✕
            </button>
            <img
              src={coreState.angles[enlargedAngle].imageUrl}
              alt={coreState.angles[enlargedAngle].label}
              className="lb-lightbox-img"
            />
            <div className="lb-lightbox-bar">
              <strong>
                {coreState.angles[enlargedAngle].label} · {garmentName}
              </strong>
              <button
                type="button"
                className="lb-lightbox-download-btn"
                onClick={() =>
                  handleDownloadSingle(
                    coreState.angles[enlargedAngle].imageUrl!,
                    enlargedAngle
                  )
                }
              >
                Tải ảnh này về máy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
