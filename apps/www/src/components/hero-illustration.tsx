// 2D floor plan → isometric model. Pure SVG, colours follow the theme tokens.
export function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 520 260"
      className="h-auto w-full text-foreground"
      role="img"
      aria-label="A 2D floor plan turning into a 3D building model"
    >
      <defs>
        <pattern id="grid" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" className="fill-subtle" opacity="0.5" />
        </pattern>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 10 5 0 10z" className="fill-accent" />
        </marker>
      </defs>

      {/* Floor plan */}
      <rect x="12" y="44" width="196" height="172" rx="10" fill="url(#grid)" className="stroke-border" />
      <g fill="none" stroke="currentColor" strokeLinecap="square">
        <rect x="32" y="80" width="160" height="120" strokeWidth="6" />
        <path d="M120 80v62M120 172v28M32 140h40M98 140h22" strokeWidth="3" />
        <path d="M72 140a26 26 0 0 1 26 -26" strokeWidth="1.5" strokeDasharray="3 3" className="stroke-muted" />
        <path d="M150 200h24" strokeWidth="6" className="stroke-background" />
      </g>
      <g className="fill-muted font-mono" fontSize="10">
        <path d="M32 64h160M32 60v8M192 60v8" className="stroke-muted" strokeWidth="1" />
        <text x="112" y="58" textAnchor="middle">12.00</text>
        <text x="62" y="102" textAnchor="middle">Living</text>
        <text x="156" y="116" textAnchor="middle">Bed</text>
        <text x="76" y="176" textAnchor="middle">Kitchen</text>
      </g>

      {/* Arrow */}
      <path d="M222 130h56" strokeWidth="2" className="stroke-accent" markerEnd="url(#arrow)" />
      <text x="248" y="120" textAnchor="middle" fontSize="11" className="fill-accent font-mono font-semibold">
        IFC
      </text>

      {/* Isometric model */}
      <g transform="translate(400 118)" strokeLinejoin="round" strokeWidth="1.5" className="stroke-foreground">
        <path d="M0 -56 97 0 60.6 -7 -36.4 -63z" className="fill-accent" opacity="0.55" />
        <path d="M-72.7 42 24.2 98 24.2 42 -72.7 -14z" className="fill-surface" />
        <path d="M97 56 24.2 98 24.2 42 97 0z" className="fill-border" />
        <path d="M97 0 24.2 42 60.6 -7z" className="fill-border" />
        <path d="M-72.7 -14 24.2 42 60.6 -7 -36.4 -63z" className="fill-accent" />
        {/* windows and door */}
        <path d="M-54 21 -36 31.5 -36 15.5 -54 5z M-14 44 4 54.5 4 38.5 -14 28z" className="fill-accent-soft" />
        <path d="M58 54 44 62 44 38 58 30z" className="fill-surface" />
        <path d="M-72.7 14 24.2 70 97 28" fill="none" strokeDasharray="4 3" className="stroke-muted" />
      </g>
      <g className="fill-muted font-mono" fontSize="10">
        <text x="300" y="254">IfcWall · IfcSlab · IfcRoof</text>
        <text x="300" y="240">IfcBuildingStorey ×2</text>
      </g>
    </svg>
  );
}
