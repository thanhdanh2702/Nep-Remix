import { useEffect } from 'react';

export type ToastTone = 'info' | 'success' | 'error';

/** Small status note that slides up from the bottom and clears itself after 6s.
 *  It sits under any open modal (see --z-toast / --z-modal). */
export function Toast({ message, tone = 'info', onClose }: { message: string; tone?: ToastTone; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [message, onClose]);
  return <div className={`toast is-${tone}`} role="status">
    <span className="toast-mark" aria-hidden="true">{tone === 'error' ? '✕' : tone === 'success' ? '✓' : '✦'}</span>
    <span className="toast-message">{message}</span>
    <button onClick={onClose} aria-label="Đóng thông báo">Đóng</button>
  </div>;
}

/** Messages that report a reward or a saved result read as success. */
export function toneFor(message: string): ToastTone {
  if (/^\+|Đã (nhận|thêm|lưu)/.test(message)) return 'success';
  return 'info';
}
