type Kind = 'lotus' | 'play' | 'upload' | 'menu' | 'close' | 'chest' | 'book';
export function PixelIcon({ kind }: { kind: Kind }) {
  const simple = ['play', 'upload', 'menu', 'close'].includes(kind);
  return <svg className={'nep-icon nep-icon-' + kind} viewBox="0 0 32 32" fill="none" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
    {simple ? <g fill="currentColor">
      {kind === 'play' && <path d="M8 3h4v3h5v3h5v3h5v3h3v2h-3v3h-5v3h-5v3h-5v3H8z" />}
      {kind === 'upload' && <path d="M14 3h4v3h3v3h3v3h-4V9h-2v14h-4V9h-2v3H8V9h3V6h3zM3 16h4v11h18V16h4v15H3z" />}
      {kind === 'menu' && <path d="M3 5h26v4H3zm0 9h26v4H3zm0 9h26v4H3z" />}
      {kind === 'close' && <path d="M5 3h4v4h4v4h6V7h4V3h4v6h-4v4h-4v6h4v4h4v6h-4v-4h-4v-4h-6v4H9v4H5v-6h4v-4h4v-6H9V9H5z" />}
    </g> : kind === 'lotus' ? <>
      <path fill="#2B2035" d="M14 1h4v3h3v4h3v3h5v3h3v6h-3v5h-6v4h-5v2h-4v-2H9v-4H3v-5H0v-6h3v-3h5V8h3V4h3z" />
      <path fill="#E9B66B" d="M14 3h4v3h3v5h7v4h2v4h-3v4h-7v4h-8v-4H5v-4H2v-4h2v-4h7V6h3z" />
      <path fill="#A72D60" d="M13 7h6v6h9v5h-3v3h-5v4h-8v-4H7v-3H4v-5h9z" />
      <path fill="#D986A7" d="M5 13h6v3h3v5H9v-3H6zm16 0h6v5h-3v3h-6v-5h3z" />
      <path fill="#F4CAD7" d="M14 6h4v3h3v8h-3v5h-4v-5h-3V9h3z" />
      <path fill="#FFF1DF" d="M15 9h2v4h2v4h-2v3h-2v-3h-2v-4h2z" />
      <path fill="#E9B66B" d="M7 24h18v2H7zm6 3h6v2h-6z" />
    </> : kind === 'chest' ? <>
      <path fill="#2B2035" d="M8 3h16v3h5v6h2v16H1V12h2V6h5z" />
      <path fill="#B7753F" d="M8 5h16v3h3v5H5V8h3zM3 15h26v11H3z" />
      <path fill="#6D3E32" d="M5 16h22v9H5zM7 9h18v3H7z" />
      <path fill="#E9B66B" d="M7 5h3v9H7zm15 0h3v9h-3zM4 15h3v10H4zm21 0h3v10h-3zm-13-3h8v8h-8z" />
      <path fill="#FFF1DF" d="M14 13h4v3h-4z" /><path fill="#2B2035" d="M15 16h2v3h-2z" />
      <path fill="#D986A7" d="M4 22h3v3h3v3H4zm21-2h3v3h3v5h-6z" /><path fill="#F4CAD7" d="M26 24h2v2h-2z" />
    </> : <>
      <path fill="#2B2035" d="M4 3h11v2h3V3h10v2h2v23H19v2h-6v-2H2V5h2z" />
      <path fill="#A72D60" d="M4 6h10v2h4V6h10v19H18v2h-4v-2H4z" />
      <path fill="#E9B66B" d="M4 5h10v2h4V5h10v17H18v3h-4v-3H4z" />
      <path fill="#FFF1DF" d="M5 6h8v2h2v13h-3v-1H5zm14 0h8v14h-7v1h-3V8h2z" />
      <path fill="#B7753F" d="M15 8h2v17h-2zM7 9h5v1H7zm0 4h5v1H7zm0 4h5v1H7z" />
      <path fill="#D986A7" d="M21 9h2v2h2v2h2v2h-3v3h-4v-3h-2v-2h2v-2h1z" /><path fill="#F4CAD7" d="M21 10h2v5h-2z" />
    </>}
  </svg>;
}
