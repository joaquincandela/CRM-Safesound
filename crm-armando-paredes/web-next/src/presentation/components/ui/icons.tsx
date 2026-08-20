import type { SVGProps } from "react";

// Set de íconos stroke, 1.6px, heredan currentColor. Sin librerías.
type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...p,
});

export const IconDashboard = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);
export const IconPipeline = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 6h18M6 12h12M9 18h6" />
  </svg>
);
export const IconProspectos = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3" />
    <path d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5" />
    <path d="M16 11a3 3 0 0 0 0-6M20 19c0-2.2-1.2-4-3-4.6" />
  </svg>
);
export const IconProyectos = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 21V7l7-4 7 4v14" />
    <path d="M17 21V11l4 2v8" />
    <path d="M7 9h2M7 13h2M7 17h2" />
  </svg>
);
export const IconInventario = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 9v12M15 3v6" />
  </svg>
);
export const IconProducts = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3 4 7l8 4 8-4-8-4Z" />
    <path d="M4 7v10l8 4 8-4V7" />
    <path d="M12 11v10" />
  </svg>
);
export const IconTags = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 10 12 2H4v8l8 8 8-8Z" />
    <circle cx="7.5" cy="7.5" r="1.2" />
  </svg>
);
export const IconUsers = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3" />
    <path d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5" />
    <path d="M17 11a3 3 0 1 0 0-6" />
    <path d="M20 19c0-2.2-1.3-4.1-3.2-4.8" />
  </svg>
);
export const IconOrders = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 6h13" />
    <path d="M8 12h13" />
    <path d="M8 18h13" />
    <path d="M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
);
export const IconTruck = (p: P) => (
  <svg {...base(p)}>
    <path d="M10 17H6a2 2 0 0 1-2-2V7h10v10Z" />
    <path d="M14 10h3l3 3v4h-6" />
    <circle cx="7.5" cy="17.5" r="1.5" />
    <circle cx="17.5" cy="17.5" r="1.5" />
  </svg>
);
export const IconReceipt = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 3h10v18l-2-1.5L12 21l-3-1.5L7 21V3Z" />
    <path d="M9 8h6M9 12h6M9 16h4" />
  </svg>
);
export const IconSettings = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .8 1.9 1.9 0 0 1-3.4 0 1.7 1.7 0 0 0-1-.8 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.8-1 1.9 1.9 0 0 1 0-3.4 1.7 1.7 0 0 0 .8-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.8 1.9 1.9 0 0 1 3.4 0 1.7 1.7 0 0 0 1 .8 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 .8 1 1.9 1.9 0 0 1 0 3.4 1.7 1.7 0 0 0-.8 1Z" />
  </svg>
);
export const IconLogout = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);
export const IconAlertas = (p: P) => (
  <svg {...base(p)}>
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);
export const IconAuto = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6 6l1.5 1.5M16.5 16.5L18 18" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);
export const IconSearch = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3-3" />
  </svg>
);
export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconContratos = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>
  </svg>
);
export const IconCronograma = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="3" y1="9" x2="21" y2="9"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
  </svg>
);
export const IconReporteria = (p: P) => (
  <svg {...base(p)}>
    <path d="M18 20V10M12 20V4M6 20v-6"/>
  </svg>
);
export const IconPricing = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
export const IconWhatsapp = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 21l1.6-4.2A8 8 0 1 1 8 19.5z" />
    <path d="M8.5 9.5c0 3 2 5 5 5 .8 0 1.2-.4 1.2-1l-.3-1.2-1.5-.5-.8.8c-1-.4-1.8-1.2-2.2-2.2l.8-.8-.5-1.5L9.5 7c-.6 0-1 .4-1 1.2z" />
  </svg>
);
export const IconMail = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);
export const IconVisit = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);
export const IconCall = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 3h3l2 5-2 1.5a11 11 0 0 0 5 5L19 12l2 5v3a1 1 0 0 1-1 1A16 16 0 0 1 4 4a1 1 0 0 1 1-1z" />
  </svg>
);
export const IconArrowUp = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);
export const IconArrowDown = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
);
export const IconBolt = (p: P) => (
  <svg {...base(p)}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
  </svg>
);
export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const IconCotizador = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M8 7h8M8 11h2M8 15h2" />
    <path d="M13 11h3v6h-3z" />
  </svg>
);
export const IconCopy = (p: P) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h8" />
  </svg>
);
export const IconSun = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
export const IconMoon = (p: P) => (
  <svg {...base(p)}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
  </svg>
);
export const IconGrid = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
  </svg>
);
export const IconList = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
);
export const IconDownload = (p: P) => (
  <svg {...base(p)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);
export const IconUpload = (p: P) => (
  <svg {...base(p)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
  </svg>
);
export const IconEdit = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
);
export const IconClose = (p: P) => (
  <svg {...base(p)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
export const IconMenu = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
export const IconImage = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="m21 15-5-5L5 21" />
  </svg>
);
export const IconCalendar = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
export const IconMessage = (p: P) => (
  <svg {...base(p)}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
export const IconInfluencer = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 2a3 3 0 0 0-3 3v1a7 7 0 0 0-4 6.3V14h14v-1.7a7 7 0 0 0-4-6.3V5a3 3 0 0 0-3-3Z" />
    <path d="M9 14v3a3 3 0 0 0 6 0v-3M9 14H4a1 1 0 0 1-1-1v-.7a7 7 0 0 1 4-6.3M15 14h5a1 1 0 0 0 1-1v-.7a7 7 0 0 0-4-6.3" />
  </svg>
);
export const IconCoin = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10M9.5 9.5a2.5 2 0 0 1 2.5-1.5c1.4 0 2.5.7 2.5 1.7 0 2.3-5 1.3-5 3.5 0 1 1.1 1.8 2.5 1.8a2.6 2 0 0 0 2.5-1.5" />
  </svg>
);
export const IconCosteo = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 7h8M8 11h8M8 15h3M13 15l4-4M17 15h.01" />
  </svg>
);
export const IconSimulador = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 4v16h16" />
    <path d="M7 15l3.5-4.5 3 2 4-6" />
    <path d="M8 19h8M9 7h.01M15 7h.01" />
  </svg>
);
