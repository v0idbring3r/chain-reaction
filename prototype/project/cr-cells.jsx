// Visual building blocks — Atom orbs, Cell, Board, screen chrome.

const CR_PALETTES = {
  neon: ['#00E5FF', '#FF2E93', '#B6FF3C', '#FFB020'], // cyan / magenta / lime / amber
  arcade: ['#3D8BFF', '#FF4D6D', '#7CFFB2', '#FFE45E'],
  toxic: ['#39FF14', '#FF00E5', '#00F0FF', '#FFD600'],
};

const CR_PLAYER_NAMES = ['CYAN', 'MAGENTA', 'LIME', 'AMBER'];

function crGlow(hex, strength = 1) {
  return `0 0 ${10 * strength}px ${hex}cc, 0 0 ${22 * strength}px ${hex}80, 0 0 ${40 * strength}px ${hex}40`;
}

// ── Atom orb ──────────────────────────────────────────────
function CRAtom({ size = 14, color = '#00E5FF', shape = 'orb', style = {} }) {
  if (shape === 'hex') {
    return (
      <div style={{
        width: size, height: size * 0.92,
        background: color,
        clipPath: 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)',
        boxShadow: crGlow(color, size / 14),
        ...style,
      }} />
    );
  }
  if (shape === 'nucleus') {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `radial-gradient(circle at 35% 30%, #fff, ${color} 60%, ${color}aa)`,
        boxShadow: crGlow(color, size / 14) + `, inset 0 0 ${size * 0.4}px ${color}`,
        border: `1px solid ${color}`,
        ...style,
      }} />
    );
  }
  // orb (default)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle at 30% 25%, #fff 0%, ${color} 55%, ${color} 100%)`,
      boxShadow: crGlow(color, size / 14),
      ...style,
    }} />
  );
}

// Layout positions of atoms within a cell (count 1..3 + critical animation)
function CRAtomCluster({ count, color, cellSize, shape, criticalSoon }) {
  const s = Math.max(8, cellSize * 0.32);
  const orbit = cellSize * 0.18;
  const wobbleClass = criticalSoon ? 'cr-wobble' : '';
  const positions = [];
  if (count === 1) {
    positions.push({ x: 0, y: 0, delay: 0 });
  } else if (count === 2) {
    positions.push({ x: -orbit * 0.6, y: 0, delay: 0 });
    positions.push({ x: orbit * 0.6, y: 0, delay: 0.5 });
  } else {
    // 3
    positions.push({ x: 0, y: -orbit * 0.7, delay: 0 });
    positions.push({ x: -orbit * 0.7, y: orbit * 0.45, delay: 0.33 });
    positions.push({ x: orbit * 0.7, y: orbit * 0.45, delay: 0.66 });
  }
  return (
    <div className={wobbleClass} style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {positions.map((p, i) => (
        <div key={i} className="cr-atom-spin" style={{
          position: 'absolute',
          transform: `translate(${p.x}px, ${p.y}px)`,
          animationDelay: `${p.delay}s`,
        }}>
          <CRAtom size={s} color={color} shape={shape} />
        </div>
      ))}
    </div>
  );
}

// ── Cell ──────────────────────────────────────────────────
function CRCell({
  c, r, cell, cellSize, shape, criticalSoon, exploding, justAdded,
  currentPlayerColor, palette, onTap,
}) {
  const color = cell.owner !== null && palette ? palette[cell.owner % palette.length] : null;
  const borderColor = color || 'rgba(255,255,255,0.07)';
  const edgeGlow = color ? `inset 0 0 18px ${color}30, 0 0 6px ${color}40` : 'none';
  return (
    <div
      onClick={onTap}
      style={{
        position: 'relative',
        width: cellSize, height: cellSize,
        border: `1px solid ${borderColor}`,
        borderRadius: 6,
        boxShadow: edgeGlow,
        cursor: 'pointer',
        background: color ? `${color}08` : 'transparent',
        transition: 'border-color 180ms, box-shadow 180ms, background 180ms',
      }}
    >
      {/* tap hint when empty and current player can play here */}
      {cell.count === 0 && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0.18, pointerEvents: 'none',
        }}>
          <div style={{
            width: 4, height: 4, borderRadius: '50%',
            background: currentPlayerColor,
            boxShadow: crGlow(currentPlayerColor, 0.4),
          }} />
        </div>
      )}
      {cell.count > 0 && color && (
        <div className={justAdded ? 'cr-pop' : ''} style={{ position: 'absolute', inset: 0 }}>
          <CRAtomCluster
            count={cell.count}
            color={color}
            cellSize={cellSize}
            shape={shape}
            criticalSoon={criticalSoon}
          />
        </div>
      )}
      {exploding && color && (
        <div className="cr-explode" style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: cellSize * 0.9, height: cellSize * 0.9, borderRadius: '50%',
            background: `radial-gradient(circle, #fff 0%, ${color} 35%, transparent 70%)`,
            filter: `drop-shadow(0 0 12px ${color})`,
          }} />
        </div>
      )}
    </div>
  );
}

// ── Traveling atom (between cells during explosion) ───────
function CRTraveler({ from, to, color, shape, cellSize, duration = 220 }) {
  const dx = (to.c - from.c) * cellSize;
  const dy = (to.r - from.r) * cellSize;
  const styleVars = {
    '--cr-tx': `${dx}px`,
    '--cr-ty': `${dy}px`,
    animationDuration: `${duration}ms`,
  };
  return (
    <div className="cr-travel" style={{
      position: 'absolute',
      left: from.c * cellSize + cellSize / 2,
      top: from.r * cellSize + cellSize / 2,
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      ...styleVars,
    }}>
      <CRAtom size={cellSize * 0.36} color={color} shape={shape} />
    </div>
  );
}

// ── Particle burst ────────────────────────────────────────
function CRBurst({ c, r, color, cellSize }) {
  const particles = Array.from({ length: 12 }).map((_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const dx = Math.cos(angle) * cellSize * 1.1;
    const dy = Math.sin(angle) * cellSize * 1.1;
    return { dx, dy, i };
  });
  return (
    <div style={{
      position: 'absolute',
      left: c * cellSize + cellSize / 2,
      top: r * cellSize + cellSize / 2,
      width: 0, height: 0, pointerEvents: 'none',
    }}>
      {particles.map(p => (
        <div key={p.i} className="cr-particle" style={{
          '--cr-px': `${p.dx}px`,
          '--cr-py': `${p.dy}px`,
          background: color,
          boxShadow: crGlow(color, 0.6),
        }} />
      ))}
      <div className="cr-shockwave" style={{
        borderColor: color,
        boxShadow: crGlow(color, 0.5),
      }} />
    </div>
  );
}

Object.assign(window, {
  CR_PALETTES, CR_PLAYER_NAMES, crGlow,
  CRAtom, CRAtomCluster, CRCell, CRTraveler, CRBurst,
});
