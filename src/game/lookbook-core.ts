import type { StudioDraft } from '../core';
import type { LookbookRequest, LookbookSuccessResponse, LookbookImage } from '../server/ai/lookbook';
import { content } from './store';
import { AI_MODELS } from '../config/ai-models';

export type LookbookAngleId = 'front' | 'three_quarter' | 'back' | 'close_up';

export const LOOKBOOK_ANGLES: Array<{
  id: LookbookAngleId;
  label: string;
}> = [
  { id: 'front', label: 'Chính diện' },
  { id: 'three_quarter', label: 'Góc nghiêng' },
  { id: 'back', label: 'Sau lưng' },
  { id: 'close_up', label: 'Cận cảnh' }
];

export interface AngleState {
  id: LookbookAngleId;
  label: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  imageUrl?: string;
  error?: string;
}

export interface LookbookCoreState {
  status: 'idle' | 'generating' | 'completed' | 'fallback';
  aiBadge: 'ok' | 'cached' | 'fallback';
  progress: {
    completed: number;
    total: number;
  };
  angles: Record<LookbookAngleId, AngleState>;
  watermark?: string;
  disclosure?: string;
  story?: string;
  errorMessage?: string;
  durationMs?: number;
}

export function createInitialLookbookState(): LookbookCoreState {
  return {
    status: 'idle',
    aiBadge: 'fallback',
    progress: { completed: 0, total: 4 },
    angles: {
      front: { id: 'front', label: 'Chính diện', status: 'pending' },
      three_quarter: { id: 'three_quarter', label: 'Góc nghiêng', status: 'pending' },
      back: { id: 'back', label: 'Sau lưng', status: 'pending' },
      close_up: { id: 'close_up', label: 'Cận cảnh', status: 'pending' }
    }
  };
}

export function buildLookbookPayload(draft: StudioDraft, eventTitle: string): LookbookRequest {
  const garment = content.garmentsById.get(draft.garmentId);
  return {
    garmentId: draft.garmentId,
    garmentName: garment?.name ?? draft.garmentId,
    silhouette: draft.silhouette,
    colorPalette: [...draft.colorPalette],
    accessoryNames: Object.values(draft.equippedAccessories)
      .filter((id): id is string => Boolean(id))
      .map(id => content.accessoriesById.get(id)?.name ?? id),
    eventTitle
  };
}

// In-memory cache for lookbook shoots on the client side
const clientLookbookCache = new Map<string, {
  images: LookbookImage[];
  watermark: string;
  disclosure: string;
  story?: string;
  durationMs?: number;
}>();

export function clearLookbookCache(draft: StudioDraft, eventTitle: string): void {
  const cacheKey = getLookbookCacheKey(draft, eventTitle);
  clientLookbookCache.delete(cacheKey);
}

export function getLookbookCacheKey(draft: StudioDraft, eventTitle: string): string {
  const acc = Object.values(draft.equippedAccessories).filter(Boolean).sort().join(',');
  return `${draft.garmentId}_${draft.silhouette}_${draft.colorPalette.join('')}_${acc}_${eventTitle}`;
}

export interface StreamCallbacks {
  onStateChange: (state: LookbookCoreState) => void;
  onAngleComplete?: (angle: LookbookAngleId, image: LookbookImage) => void;
}

/**
 * Retries a single angle that previously failed.
 */
export async function retrySingleAngleCore(
  draft: StudioDraft,
  eventTitle: string,
  angleId: LookbookAngleId,
  currentState: LookbookCoreState,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<LookbookCoreState> {
  const targetAngle = currentState.angles[angleId];
  if (!targetAngle) return currentState;

  let state: LookbookCoreState = {
    ...currentState,
    angles: {
      ...currentState.angles,
      [angleId]: { ...targetAngle, status: 'generating', error: undefined }
    }
  };
  callbacks.onStateChange(state);

  const payload = buildLookbookPayload(draft, eventTitle);

  try {
    const response = await fetch('/api/ai/lookbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, singleAngle: angleId }),
      signal
    });

    const json = await response.json();
    if (json.ok && json.data?.image) {
      const img: LookbookImage = json.data.image;
      const updatedAngles = {
        ...state.angles,
        [angleId]: { ...targetAngle, status: 'completed' as const, imageUrl: img.imageUrl }
      };
      const completedCount = Object.values(updatedAngles).filter(a => a.status === 'completed').length;
      state = {
        ...state,
        angles: updatedAngles,
        progress: { completed: completedCount, total: 4 },
        status: completedCount === 4 ? 'completed' : state.status
      };

      if (completedCount === 4) {
        const cacheKey = getLookbookCacheKey(draft, eventTitle);
        const images: LookbookImage[] = [
          { angle: 'front', angleLabel: 'Chính diện', imageUrl: updatedAngles.front.imageUrl! },
          { angle: 'three_quarter', angleLabel: 'Góc nghiêng', imageUrl: updatedAngles.three_quarter.imageUrl! },
          { angle: 'back', angleLabel: 'Sau lưng', imageUrl: updatedAngles.back.imageUrl! },
          { angle: 'close_up', angleLabel: 'Cận cảnh', imageUrl: updatedAngles.close_up.imageUrl! }
        ];
        clientLookbookCache.set(cacheKey, {
          images,
          watermark: state.watermark || 'Ảnh do AI tạo - Tiệm May Nếp 2026',
          disclosure: state.disclosure || '',
          story: state.story
        });
      }

      callbacks.onStateChange(state);
      return state;
    } else {
      throw new Error(json.error || 'Lỗi chụp góc');
    }
  } catch (err) {
    state = {
      ...state,
      angles: {
        ...state.angles,
        [angleId]: {
          ...targetAngle,
          status: 'error',
          error: err instanceof Error ? err.message : 'Lỗi kết nối AI'
        }
      }
    };
    callbacks.onStateChange(state);
    return state;
  }
}

/**
 * Executes a streaming capture session for Lookbook AI:
 * - Streams angle-by-angle updates as each finishes.
 * - Handles per-angle failures without halting other angles.
 * - Enforces 45s maximum timeout.
 * - Caches completed shoots so identical drafts return immediately.
 */
export async function captureLookbookCore(
  draft: StudioDraft,
  eventTitle: string,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<LookbookCoreState> {
  const cacheKey = getLookbookCacheKey(draft, eventTitle);
  const cachedShoot = clientLookbookCache.get(cacheKey);

  // Return cached result immediately if available
  if (cachedShoot && cachedShoot.images.length === 4) {
    const cachedState: LookbookCoreState = {
      status: 'completed',
      aiBadge: 'cached',
      progress: { completed: 4, total: 4 },
      angles: {
        front: { id: 'front', label: 'Chính diện', status: 'completed', imageUrl: cachedShoot.images[0]?.imageUrl },
        three_quarter: { id: 'three_quarter', label: 'Góc nghiêng', status: 'completed', imageUrl: cachedShoot.images[1]?.imageUrl },
        back: { id: 'back', label: 'Sau lưng', status: 'completed', imageUrl: cachedShoot.images[2]?.imageUrl },
        close_up: { id: 'close_up', label: 'Cận cảnh', status: 'completed', imageUrl: cachedShoot.images[3]?.imageUrl }
      },
      watermark: cachedShoot.watermark,
      disclosure: cachedShoot.disclosure,
      story: cachedShoot.story,
      durationMs: cachedShoot.durationMs
    };
    callbacks.onStateChange(cachedState);
    return cachedState;
  }

  const startTime = Date.now();

  // Initialize generating state
  let currentState: LookbookCoreState = {
    status: 'generating',
    aiBadge: 'ok',
    progress: { completed: 0, total: 4 },
    angles: {
      front: { id: 'front', label: 'Chính diện', status: 'generating' },
      three_quarter: { id: 'three_quarter', label: 'Góc nghiêng', status: 'generating' },
      back: { id: 'back', label: 'Sau lưng', status: 'generating' },
      close_up: { id: 'close_up', label: 'Cận cảnh', status: 'generating' }
    }
  };
  callbacks.onStateChange(currentState);

  const payload = buildLookbookPayload(draft, eventTitle);
  const timeoutMs = AI_MODELS.LOOKBOOK_TIMEOUT_MS;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

  try {
    const response = await fetch('/api/ai/lookbook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({ ...payload, stream: true }),
      signal: combinedSignal
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';

    // If server responded with SSE stream:
    if (contentType.includes('text/event-stream') && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          if (!block.trim()) continue;
          let eventType = 'message';
          let eventData = '';

          for (const line of block.split('\n')) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6).trim();
            }
          }

          if (!eventData) continue;
          try {
            const parsed = JSON.parse(eventData);

            if (eventType === 'angle') {
              const angleId = parsed.angle as LookbookAngleId;
              const angleState = currentState.angles[angleId];

              if (parsed.status === 'completed' && parsed.image) {
                currentState = {
                  ...currentState,
                  angles: {
                    ...currentState.angles,
                    [angleId]: {
                      ...angleState,
                      status: 'completed',
                      imageUrl: parsed.image.imageUrl
                    }
                  },
                  progress: {
                    ...currentState.progress,
                    completed: Math.min(4, currentState.progress.completed + 1)
                  }
                };
                callbacks.onAngleComplete?.(angleId, parsed.image);
              } else if (parsed.status === 'error') {
                currentState = {
                  ...currentState,
                  angles: {
                    ...currentState.angles,
                    [angleId]: {
                      ...angleState,
                      status: 'error',
                      error: parsed.error || 'Lỗi chụp góc'
                    }
                  }
                };
              }
              callbacks.onStateChange(currentState);
            } else if (eventType === 'done') {
              const isCached = Boolean(parsed.cached);
              const completedImages: LookbookImage[] = parsed.images || [];
              const durationMs = Date.now() - startTime;

              const anySuccess = Object.values(currentState.angles).some(a => a.status === 'completed');
              currentState = {
                ...currentState,
                status: anySuccess ? 'completed' : 'fallback',
                aiBadge: anySuccess ? (isCached ? 'cached' : 'ok') : 'fallback',
                watermark: parsed.watermark,
                disclosure: parsed.disclosure,
                story: parsed.story,
                durationMs
              };

              if (completedImages.length === 4) {
                clientLookbookCache.set(cacheKey, {
                  images: completedImages,
                  watermark: parsed.watermark || 'Ảnh do AI tạo - Tiệm May Nếp 2026',
                  disclosure: parsed.disclosure || '',
                  story: parsed.story,
                  durationMs
                });
              }

              callbacks.onStateChange(currentState);
              return currentState;
            } else if (eventType === 'error') {
              throw new Error(parsed.message || 'Lỗi server');
            }
          } catch (parseErr) {
            console.warn('[Lookbook SSE Parse Error]', parseErr);
          }
        }
      }
      // Stream closed without a 'done' event: let the catch below mark unfinished angles as errors
      throw new Error('Lookbook stream ended early');
    } else {
      // Fallback for non-streaming JSON response:
      const json = await response.json();
      const durationMs = Date.now() - startTime;
      if (json.ok && json.data?.images?.length) {
        const images: LookbookImage[] = json.data.images;
        // The server drops failed angles, so match by angle id rather than by position
        const angleState = (id: LookbookAngleId, label: string): AngleState => {
          const imageUrl = images.find(img => img.angle === id)?.imageUrl;
          return imageUrl ? { id, label, status: 'completed', imageUrl } : { id, label, status: 'error', error: 'Không chụp được góc này' };
        };
        currentState = {
          status: 'completed',
          aiBadge: json.cached ? 'cached' : 'ok',
          progress: { completed: images.length, total: 4 },
          angles: {
            front: angleState('front', 'Chính diện'),
            three_quarter: angleState('three_quarter', 'Góc nghiêng'),
            back: angleState('back', 'Sau lưng'),
            close_up: angleState('close_up', 'Cận cảnh')
          },
          watermark: json.data.watermark,
          disclosure: json.data.disclosure,
          story: json.data.story,
          durationMs
        };
        if (images.length === 4) {
          clientLookbookCache.set(cacheKey, {
            images,
            watermark: json.data.watermark || 'Ảnh do AI tạo - Tiệm May Nếp 2026',
            disclosure: json.data.disclosure || '',
            story: json.data.story,
            durationMs
          });
        }
        callbacks.onStateChange(currentState);
        return currentState;
      } else {
        throw new Error(json.fallback?.message || 'Không tạo được ảnh lookbook');
      }
    }
  } catch (err) {
    if (combinedSignal.aborted && signal?.aborted) {
      // User cancelled voluntarily or draft changed
      currentState = createInitialLookbookState();
      callbacks.onStateChange(currentState);
      return currentState;
    }

    // Timeout or network/AI error: mark any remaining generating angles as error
    const angles = { ...currentState.angles };
    for (const key of Object.keys(angles) as LookbookAngleId[]) {
      if (angles[key].status === 'generating' || angles[key].status === 'pending') {
        angles[key] = { ...angles[key], status: 'error', error: 'Quá thời gian hoặc lỗi kết nối' };
      }
    }

    const anySuccess = Object.values(angles).some(a => a.status === 'completed');
    currentState = {
      ...currentState,
      status: anySuccess ? 'completed' : 'fallback',
      aiBadge: 'fallback',
      angles,
      errorMessage: 'AI đang bận hoặc quá thời gian'
    };
    callbacks.onStateChange(currentState);
    return currentState;
  }

  return currentState;
}
