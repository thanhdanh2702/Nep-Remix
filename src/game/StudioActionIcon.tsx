import { PixelIcon } from '../welcome/PixelIcon';

export function StudioActionIcon({ kind }: { kind: 'book' | 'save' | 'sparkle' }) {
  if (kind === 'book') return <PixelIcon kind="book" />;
  return <svg className="studio-action-icon" viewBox="0 0 24 24" aria-hidden="true" shapeRendering="crispEdges">
    {kind === 'save'
      ? <path fill="currentColor" d="M3 2h16l3 3v17H2V2zm3 1v7h12V3zm0 11v7h12v-7zm8-10v5h3V4z" fillRule="evenodd" />
      : <><path fill="#d7a358" d="M10 1h4v6h5v4h4v3h-4v4h-5v5h-4v-5H5v-4H1v-3h4V7h5z" /><path fill="#59303e" d="M11 5h2v4h4v2h3v2h-3v2h-4v5h-2v-5H7v-2H4v-2h3V9h4z" /><path fill="#fff1df" d="M11 9h2v2h2v2h-2v2h-2v-2H9v-2h2z" /></>}
  </svg>;
}
