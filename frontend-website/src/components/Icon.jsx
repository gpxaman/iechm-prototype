const PATHS = {
  cube: 'm12 3 8 4.5v9L12 21l-8-4.5v-9L12 3ZM4 7.5 12 12l8-4.5M12 12v9',
  gear: 'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM12 3v2.4M12 18.6V21M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M3 12h2.4M18.6 12H21M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7',
  factory: 'M3 21V10l6 4v-4l6 4v-4l6 4v7ZM3 21h18M7 21v-4M12 21v-4M17 21v-4',
  cart: 'M9 20a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8Zm9 0a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8ZM3 4h2l2.3 11.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6',
  wrench: 'M14.7 6.3a4 4 0 0 0-5.6 5.1L3 17.5 5.5 20l6.1-6.1a4 4 0 0 0 5.1-5.6l-2.6 2.6-2-2 2.6-2.6Z',
  handshake: 'm8 12 3 3 6-6M2 12h4l3-3 3 3h10',
  bulb: 'M9 18h6M10 21h4M8 14a4 4 0 1 1 8 0c0 1.8-1 2.6-1.6 3.4-.4.5-.4.6-.4 1.6H10c0-1-.1-1.1-.4-1.6C9 16.6 8 15.8 8 14Z',
  medal: 'M12 21a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM9 4h6l2 6-5 4-5-4 2-6ZM12 12v6',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
};

export default function Icon({ name, size = 22, stroke = 1.8 }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
