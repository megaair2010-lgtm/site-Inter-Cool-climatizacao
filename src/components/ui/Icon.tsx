import type { IconName } from "../../types";

/** Ícones em SVG próprios (sem biblioteca externa, para carregar rápido) */
const P: Record<IconName, string> = {
  snow: "M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 4l3 2 3-2M9 20l3-2 3 2",
  wrench: "M14.7 6.3a4 4 0 0 0 5 5L12 19l-3 3-5-5 3-3 7.7-7.7zM7 15l2 2",
  calendar: "M3 5h18v16H3zM3 10h18M8 3v4M16 3v4M8 15l2.5 2.5L16 13",
  tool: "M4 20l6-6M14 4l6 6-8 8-6-6z",
  spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6",
  doc: "M6 3h9l4 4v14H6zM15 3v4h4M9 12h6M9 16h6M9 8h3",
  vrf: "M2 7h7v12H2zM9 13h3M12 5v16M12 5h3M12 11h3M12 17h3M15 3h7v4h-7zM15 9h7v4h-7zM15 15h7v4h-7z",
  duct: "M3 7h12v6H3zM15 9h6v10M18 19v2M9 13v4M6 17h6",
  fan: "M12 12c0-4 2-7 5-6s1 5-5 6zM12 12c3 3 4 7 1 7.5s-3-4-1-7.5zM12 12c-4 1-7-1-6-4s5-.5 6 4zM12 12h.01",
  home: "M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-6h4v6",
  store: "M3 9l2-5h14l2 5M3 9v11h18V9M3 9h18M9 20v-6h6v6",
  factory: "M2 20V10l6 4V10l6 4V6h4l2 14zM2 20h20",
  clinic: "M4 21V5h16v16M10 21v-4h4v4M12 8v6M9 11h6",
  food: "M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 3-3 6s1 4 3 4v8",
  building: "M5 21V3h14v18M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M3 21h18",
  check: "M5 12.5l4.5 4.5L19 7.5",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5 4.5-5",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3",
  team: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20c0-3.5 3-6 7-6s7 2.5 7 6M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14c2.4.6 4 2.6 4 6",
  award: "M12 14a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 13L7 22l5-3 5 3-1.5-9",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4M12 15v2",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  support: "M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H5a1 1 0 0 1-1-1zM20 14h-3v6h2a1 1 0 0 0 1-1zM17 20c0 1-2 2-5 2",
  pin: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  phone: "M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z",
  mail: "M3 5h18v14H3zM3 6l9 7 9-7",
  whatsapp: "M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3zM8.5 8.5c.5-1 1.5-.8 1.8 0l.6 1.6-.9 1c.6 1.3 1.6 2.3 2.9 2.9l1-.9 1.6.6c.8.3 1 1.3 0 1.8-2.6 1.4-8.4-4.4-7-7z",
  arrow: "M5 12h14M13 6l6 6-6 6",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
  star: "M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z",
  upload: "M12 16V4M7 9l5-5 5 5M4 16v4h16v-4",
  instagram: "M4 4h16v16H4zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM17 7h.01",
  facebook: "M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z",
  linkedin: "M4 9h4v11H4zM6 4.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM10 9h4v1.6c.6-1 1.9-1.8 3.5-1.8 2.6 0 3.5 1.7 3.5 4.4V20h-4v-6c0-1.3-.4-2.2-1.6-2.2-1.3 0-1.9.9-1.9 2.2v6h-3.5z",
  chevron: "M9 6l6 6-6 6",
  camera: "M3 7h4l2-3h6l2 3h4v13H3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  quote: "M7 17c-2 0-3-1.5-3-3.5C4 10 6 7 9 6M17 17c-2 0-3-1.5-3-3.5 0-3.5 2-6.5 5-7.5",
};

export function Icon({ name, className = "h-6 w-6", strokeWidth = 1.8 }: { name: IconName; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name]} />
    </svg>
  );
}
