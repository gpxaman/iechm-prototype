// Shared inline stroke-icon set, ported from the prototype's ICON table.
const PATHS = {
  home: 'M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3-12-2 6-6 2 2-6 6-2Z',
  layers: 'm12 3 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5',
  activity: 'M3 12h4l2-7 4 14 2-7h6',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c1.5-4.5 5-6 8-6s6.5 1.5 8 6',
  back: 'M15 5 8 12l7 7',
  close: 'M6 6l12 12M18 6 6 18',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm10 3-4.3-4.3',
  mic: 'M9 3h6v11H9a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3ZM5 11a7 7 0 0 0 14 0M12 18v3',
  image: 'M3 4h18v16H3zM9 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12 6-5-5-4 4-3-3-6 6',
  doc: 'M7 3h7l4 4v14H7zM14 3v4h4M9.5 13h5M9.5 16.5h5',
  cart: 'M9 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm9 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM3 4h2l2.4 12.2a2 2 0 0 0 2 1.8h7.7a2 2 0 0 0 2-1.6L21 8H6',
  sparkle: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18',
  bolt: 'M13 2 4 14h6l-1 8 9-12h-6l1-8Z',
  chevron: 'm9 18 6-6-6-6',
  chevrondown: 'm6 9 6 6 6-6',
  check: 'M5 13l4 4L19 7',
  plus: 'M12 5v14M5 12h14',
  box: 'm21 8-9-5-9 5 9 5 9-5ZM3 8v8l9 5 9-5V8M12 13v8',
  wrench: 'M14.7 6.3a4 4 0 0 0-5.6 5.1L3 17.5 5.5 20l6.1-6.1a4 4 0 0 0 5.1-5.6l-2.6 2.6-2-2 2.6-2.6Z',
  handshake: 'm8 12 3 3 6-6M2 12h4l3-3 3 3h10',
  clip: 'M6 4h12v17H6zM9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M9 11h6M9 15h6',
  building: 'M4 3h16v18H4zM9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1',
  file: 'M14 3H6v18h12V9zM14 3v6h6',
  truck: 'M1 7h14v10H1zM15 10h4l3 3v4h-7zM6 19a1.6 1.6 0 1 0 0-3.2A1.6 1.6 0 0 0 6 19Zm12 0a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z',
  shield: 'M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z',
  upload: 'M12 16V4M7 9l5-5 5 5M5 20h14',
  scan: 'M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3M4 12h16',
  bell: 'M6 10a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6ZM10 20a2 2 0 0 0 4 0',
  coins: 'M9 14.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Zm5.5-6.5A5.5 5.5 0 1 1 9 14.5',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14',
  refresh: 'M3 12a9 9 0 0 1 15.3-6.4L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.3 6.4L3 16M3 21v-5h5',
  gear: 'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM12 3v2.4M12 18.6V21M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M3 12h2.4M18.6 12H21M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7',
  bulb: 'M9 18h6M10 21h4M8 14a4 4 0 1 1 8 0c0 1.8-1 2.6-1.6 3.4-.4.5-.4.6-.4 1.6H10c0-1-.1-1.1-.4-1.6C9 16.6 8 15.8 8 14Z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
  medal: 'M12 21a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM9 4h6l2 6-5 4-5-4 2-6ZM12 12v6',
  send: 'm3 11 18-8-8 18-2-8-8-2Z',
  target: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-4a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-3.4a.6.6 0 1 0 0-1.2.6.6 0 0 0 0 1.2Z',
};

export default function Icon({ name, size = 20, stroke = 2, style, className }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
    >
      <path d={d} />
    </svg>
  );
}
