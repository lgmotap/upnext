/**
 * Soft-3D decorative objects, built as layered-gradient SVGs.
 * Tasteful and lightweight — no external assets, no heavy 3D libs.
 */

type Props = { className?: string };

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#7a87ef" />
        <stop offset="55%" stopColor="#2d4be0" />
        <stop offset="100%" stopColor="#21349a" />
      </linearGradient>
      <linearGradient id={`${id}-light`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#dfe4fd" />
      </linearGradient>
      <radialGradient id={`${id}-sheen`} cx="0.3" cy="0.25" r="0.9">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
        <stop offset="60%" stopColor="#ffffff" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <filter id={`${id}-shadow`} x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#161a2b" floodOpacity="0.2" />
      </filter>
    </defs>
  );
}

export function SprayBottle({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 100 130" className={className} aria-hidden>
      <Defs id="spray" />
      <g filter="url(#spray-shadow)">
        {/* trigger + head */}
        <path d="M38 18 h30 a8 8 0 0 1 8 8 v8 H38 Z" fill="url(#spray-body)" />
        <path d="M30 24 q-10 1 -12 8 l6 4 q3 -6 8 -6 Z" fill="#1c6663" />
        <rect x="44" y="8" width="14" height="12" rx="4" fill="#194443" />
        {/* neck */}
        <rect x="44" y="34" width="18" height="14" rx="3" fill="url(#spray-light)" />
        {/* bottle */}
        <path d="M36 48 h34 q10 14 10 34 v32 a12 12 0 0 1 -12 12 H38 a12 12 0 0 1 -12 -12 V82 q0 -20 10 -34 Z" fill="url(#spray-body)" />
        <path d="M36 48 h34 q10 14 10 34 v32 a12 12 0 0 1 -12 12 H38 a12 12 0 0 1 -12 -12 V82 q0 -20 10 -34 Z" fill="url(#spray-sheen)" />
        {/* label */}
        <rect x="34" y="74" width="38" height="30" rx="8" fill="#ffffff" opacity="0.92" />
        <path d="M44 89 l5 5 l11 -11" stroke="#2c9f96" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* mist */}
      <g fill="#7cd4c9" opacity="0.8">
        <circle cx="10" cy="14" r="2.6" />
        <circle cx="16" cy="24" r="2" />
        <circle cx="7" cy="26" r="1.6" />
      </g>
    </svg>
  );
}

export function Sparkle({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden>
      <Defs id="spk" />
      <g filter="url(#spk-shadow)">
        <path d="M40 6 C44 26 54 36 74 40 C54 44 44 54 40 74 C36 54 26 44 6 40 C26 36 36 26 40 6 Z" fill="url(#spk-body)" />
        <path d="M40 6 C44 26 54 36 74 40 C54 44 44 54 40 74 C36 54 26 44 6 40 C26 36 36 26 40 6 Z" fill="url(#spk-sheen)" />
      </g>
      <circle cx="63" cy="16" r="4" fill="#ade7de" />
    </svg>
  );
}

export function Calendar3D({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 110 110" className={className} aria-hidden>
      <Defs id="cal" />
      <g filter="url(#cal-shadow)">
        <rect x="10" y="18" width="90" height="84" rx="16" fill="url(#cal-light)" />
        <path d="M10 34 a16 16 0 0 1 16 -16 h58 a16 16 0 0 1 16 16 v10 H10 Z" fill="url(#cal-body)" />
        <rect x="28" y="8" width="10" height="18" rx="5" fill="#194443" />
        <rect x="72" y="8" width="10" height="18" rx="5" fill="#194443" />
        <g fill="#cfdede">
          <rect x="24" y="54" width="16" height="12" rx="4" />
          <rect x="47" y="54" width="16" height="12" rx="4" />
          <rect x="70" y="54" width="16" height="12" rx="4" />
          <rect x="24" y="74" width="16" height="12" rx="4" />
          <rect x="70" y="74" width="16" height="12" rx="4" />
        </g>
        <rect x="47" y="74" width="16" height="12" rx="4" fill="#2c9f96" />
      </g>
    </svg>
  );
}

export function PayCard({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 120 84" className={className} aria-hidden>
      <Defs id="pay" />
      <g filter="url(#pay-shadow)">
        <rect x="8" y="8" width="104" height="68" rx="12" fill="url(#pay-body)" />
        <rect x="8" y="8" width="104" height="68" rx="12" fill="url(#pay-sheen)" />
        <rect x="20" y="24" width="22" height="16" rx="4" fill="#ffe9a8" />
        <rect x="20" y="52" width="34" height="6" rx="3" fill="#ffffff" opacity="0.85" />
        <rect x="60" y="52" width="20" height="6" rx="3" fill="#ffffff" opacity="0.55" />
        <circle cx="92" cy="28" r="9" fill="#ffffff" opacity="0.5" />
        <circle cx="102" cy="28" r="9" fill="#ffffff" opacity="0.75" />
      </g>
    </svg>
  );
}

export function Checklist3D({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 100 120" className={className} aria-hidden>
      <Defs id="chk" />
      <g filter="url(#chk-shadow)">
        <rect x="12" y="12" width="76" height="98" rx="14" fill="url(#chk-light)" />
        <rect x="34" y="4" width="32" height="16" rx="8" fill="url(#chk-body)" />
        {[34, 56, 78].map((y, i) => (
          <g key={y}>
            <rect x="24" y={y} width="16" height="16" rx="5" fill={i < 2 ? "#2c9f96" : "#cfdede"} />
            {i < 2 && (
              <path d={`M28 ${y + 8} l3.5 3.5 l6.5 -7`} stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            )}
            <rect x="48" y={y + 5} width="28" height="6" rx="3" fill="#a7c1c1" />
          </g>
        ))}
      </g>
    </svg>
  );
}

export function Paw3D({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 90 90" className={className} aria-hidden>
      <Defs id="paw" />
      <g filter="url(#paw-shadow)" fill="url(#paw-body)">
        <ellipse cx="45" cy="58" rx="20" ry="16" />
        <ellipse cx="22" cy="38" rx="8" ry="10" />
        <ellipse cx="38" cy="26" rx="8" ry="11" />
        <ellipse cx="55" cy="26" rx="8" ry="11" />
        <ellipse cx="69" cy="38" rx="8" ry="10" />
      </g>
      <ellipse cx="45" cy="58" rx="20" ry="16" fill="url(#paw-sheen)" />
    </svg>
  );
}

export function PaintRoller3D({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 110 110" className={className} aria-hidden>
      <Defs id="pnt" />
      <g filter="url(#pnt-shadow)">
        <rect x="14" y="14" width="64" height="30" rx="14" fill="url(#pnt-body)" />
        <rect x="14" y="14" width="64" height="30" rx="14" fill="url(#pnt-sheen)" />
        <rect x="82" y="20" width="8" height="18" rx="4" fill="#cfdede" />
        <path d="M90 29 h8 v16 a6 6 0 0 1 -6 6 h-18" stroke="#779d9e" strokeWidth="7" fill="none" strokeLinecap="round" />
        <rect x="68" y="50" width="13" height="40" rx="6" fill="url(#pnt-light)" stroke="#a7c1c1" strokeWidth="1.5" transform="rotate(8 74 70)" />
      </g>
    </svg>
  );
}

export function Grass3D({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 100 90" className={className} aria-hidden>
      <Defs id="grs" />
      <g filter="url(#grs-shadow)">
        <ellipse cx="50" cy="72" rx="38" ry="12" fill="url(#grs-body)" />
        <g fill="url(#grs-body)">
          <path d="M30 70 Q26 44 14 34 Q34 42 38 68 Z" />
          <path d="M44 70 Q44 36 36 22 Q54 36 52 68 Z" />
          <path d="M58 70 Q62 38 76 28 Q66 46 64 70 Z" />
          <path d="M70 70 Q78 52 88 48 Q78 60 76 71 Z" />
        </g>
        <ellipse cx="50" cy="72" rx="38" ry="12" fill="url(#grs-sheen)" />
      </g>
    </svg>
  );
}

export function Toolbox3D({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 110 100" className={className} aria-hidden>
      <Defs id="tlb" />
      <g filter="url(#tlb-shadow)">
        <path d="M40 26 a15 15 0 0 1 30 0" stroke="#194443" strokeWidth="8" fill="none" strokeLinecap="round" />
        <rect x="12" y="28" width="86" height="58" rx="12" fill="url(#tlb-body)" />
        <rect x="12" y="28" width="86" height="58" rx="12" fill="url(#tlb-sheen)" />
        <rect x="12" y="50" width="86" height="5" fill="#1c6663" opacity="0.6" />
        <rect x="44" y="44" width="22" height="14" rx="5" fill="url(#tlb-light)" />
      </g>
    </svg>
  );
}

export function Bubbles({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 110 110" className={className} aria-hidden>
      <Defs id="bub" />
      <g filter="url(#bub-shadow)">
        <circle cx="42" cy="48" r="30" fill="url(#bub-body)" opacity="0.85" />
        <circle cx="42" cy="48" r="30" fill="url(#bub-sheen)" />
        <circle cx="80" cy="32" r="14" fill="url(#bub-body)" opacity="0.7" />
        <circle cx="80" cy="32" r="14" fill="url(#bub-sheen)" />
        <circle cx="78" cy="76" r="9" fill="url(#bub-body)" opacity="0.6" />
        <circle cx="78" cy="76" r="9" fill="url(#bub-sheen)" />
        <ellipse cx="32" cy="36" rx="8" ry="5" fill="#ffffff" opacity="0.9" transform="rotate(-30 32 36)" />
      </g>
    </svg>
  );
}

export function House3D({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 110 100" className={className} aria-hidden>
      <Defs id="hou" />
      <g filter="url(#hou-shadow)">
        <path d="M55 10 L100 48 H88 V84 a8 8 0 0 1 -8 8 H30 a8 8 0 0 1 -8 -8 V48 H10 Z" fill="url(#hou-body)" />
        <path d="M55 10 L100 48 H88 V84 a8 8 0 0 1 -8 8 H30 a8 8 0 0 1 -8 -8 V48 H10 Z" fill="url(#hou-sheen)" />
        <rect x="44" y="58" width="22" height="34" rx="4" fill="url(#hou-light)" />
      </g>
    </svg>
  );
}
