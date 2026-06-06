// Screens — Home, Setup, Game, Win, Pause overlay, Tutorial.
// All neon-arcade themed. Designed to fit a phone viewport (~390x844 working area).

const CR_GRID_OPTIONS = [
  { key: 'small',  label: 'SMALL',  cols: 6, rows: 9 },
  { key: 'medium', label: 'MEDIUM', cols: 7, rows: 11 },
  { key: 'large',  label: 'LARGE',  cols: 8, rows: 13 },
];

// ── Background grid (subtle neon graph paper) ─────────────
function CRGridBg({ pattern = 'grid', children }) {
  let bg;
  if (pattern === 'grid') {
    bg = `
      radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.10), transparent 60%),
      radial-gradient(ellipse at 50% 100%, rgba(255,46,147,0.10), transparent 60%),
      linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px) 0 0/24px 24px,
      linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px) 0 0/24px 24px,
      #07071a
    `;
  } else if (pattern === 'dots') {
    bg = `
      radial-gradient(ellipse at 50% 30%, rgba(182,255,60,0.08), transparent 60%),
      radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1.5px) 0 0/22px 22px,
      #07071a
    `;
  } else if (pattern === 'scanlines') {
    bg = `
      repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 4px),
      radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.10), transparent 60%),
      #06061a
    `;
  } else {
    bg = '#07071a';
  }
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: bg,
      color: '#fff',
      fontFamily: "'Rajdhani', system-ui, sans-serif",
      overflow: 'hidden',
    }}>
      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)',
      }} />
      {children}
    </div>
  );
}

// ── Logo (CHAIN REACTION) ─────────────────────────────────
function CRLogo({ size = 1 }) {
  return (
    <div style={{ textAlign: 'center', userSelect: 'none' }}>
      <div style={{
        fontFamily: "'Orbitron', system-ui, sans-serif",
        fontWeight: 900,
        fontSize: 30 * size, lineHeight: 1,
        letterSpacing: 6 * size,
        color: '#fff',
        textShadow: `0 0 12px #00E5FF, 0 0 24px #00E5FFaa`,
      }}>CHAIN</div>
      <div style={{
        fontFamily: "'Orbitron', system-ui, sans-serif",
        fontWeight: 900,
        fontSize: 30 * size, lineHeight: 1,
        letterSpacing: 6 * size,
        color: '#fff',
        marginTop: 4 * size,
        textShadow: `0 0 12px #FF2E93, 0 0 24px #FF2E93aa`,
      }}>REACTION</div>
      <div style={{
        marginTop: 8 * size,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9 * size,
        letterSpacing: 4 * size,
        opacity: 0.55,
      }}>// CRITICAL // MASS // 0001</div>
    </div>
  );
}

// ── Neon button ───────────────────────────────────────────
function CRButton({ children, color = '#00E5FF', onClick, fullWidth, secondary, small }) {
  const pad = small ? '10px 18px' : '14px 28px';
  const fs = small ? 13 : 15;
  if (secondary) {
    return (
      <div onClick={onClick} style={{
        padding: pad,
        fontFamily: "'Orbitron', system-ui, sans-serif",
        fontWeight: 700, fontSize: fs, letterSpacing: 3,
        color, cursor: 'pointer',
        border: `1px solid ${color}55`,
        borderRadius: 4,
        background: `${color}10`,
        textAlign: 'center',
        width: fullWidth ? '100%' : 'auto',
      }}>{children}</div>
    );
  }
  return (
    <div onClick={onClick} style={{
      padding: pad,
      fontFamily: "'Orbitron', system-ui, sans-serif",
      fontWeight: 800, fontSize: fs, letterSpacing: 3,
      color: '#000', cursor: 'pointer',
      background: color,
      borderRadius: 4,
      boxShadow: crGlow(color, 0.9),
      textAlign: 'center',
      width: fullWidth ? '100%' : 'auto',
    }}>{children}</div>
  );
}

// ── HOME ──────────────────────────────────────────────────
function CRHomeScreen({ onPlay, onTutorial, dark, palette }) {
  return (
    <CRGridBg pattern="grid">
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '80px 32px 48px',
      }}>
        {/* decorative orbiting atoms */}
        <div style={{ position: 'absolute', top: 70, left: 30 }}>
          <div className="cr-float" style={{ animationDelay: '0s' }}>
            <CRAtom size={18} color={palette[0]} />
          </div>
        </div>
        <div style={{ position: 'absolute', top: 120, right: 40 }}>
          <div className="cr-float" style={{ animationDelay: '0.6s' }}>
            <CRAtom size={14} color={palette[1]} />
          </div>
        </div>
        <div style={{ position: 'absolute', top: 190, left: 60 }}>
          <div className="cr-float" style={{ animationDelay: '1.1s' }}>
            <CRAtom size={10} color={palette[2]} />
          </div>
        </div>

        <div style={{ marginTop: 40 }}>
          <CRLogo size={1} />
        </div>

        {/* preview cell with critical pulse */}
        <div style={{
          width: 120, height: 120,
          border: `1.5px solid ${palette[0]}`,
          borderRadius: 8,
          boxShadow: `inset 0 0 24px ${palette[0]}40, ${crGlow(palette[0], 0.8)}`,
          position: 'relative',
        }}>
          <CRAtomCluster count={3} color={palette[0]} cellSize={120} shape="orb" criticalSoon={true} />
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <CRButton color={palette[0]} fullWidth onClick={onPlay}>NEW GAME</CRButton>
          <CRButton color={palette[1]} secondary fullWidth onClick={onTutorial}>HOW TO PLAY</CRButton>
          <div style={{
            textAlign: 'center', marginTop: 8,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, letterSpacing: 2, opacity: 0.4,
          }}>2–4 PLAYERS · LOCAL MULTIPLAYER</div>
        </div>
      </div>
    </CRGridBg>
  );
}

// ── SETUP ─────────────────────────────────────────────────
function CRSetupScreen({
  playerCount, setPlayerCount,
  gridKey, setGridKey,
  palette,
  onStart, onBack,
}) {
  return (
    <CRGridBg pattern="grid">
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        padding: '60px 24px 40px',
      }}>
        <div onClick={onBack} style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
          letterSpacing: 2, opacity: 0.7, cursor: 'pointer', marginBottom: 24,
        }}>← BACK</div>

        <div style={{
          fontFamily: "'Orbitron', system-ui, sans-serif",
          fontSize: 22, fontWeight: 800, letterSpacing: 4,
          marginBottom: 4,
        }}>SETUP</div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, letterSpacing: 3, opacity: 0.5, marginBottom: 32,
        }}>// CONFIGURE THE REACTION</div>

        {/* Players */}
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, letterSpacing: 3, opacity: 0.6, marginBottom: 12,
        }}>PLAYERS</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {[2, 3, 4].map(n => {
            const active = n === playerCount;
            return (
              <div key={n} onClick={() => setPlayerCount(n)} style={{
                flex: 1, padding: '14px 0', textAlign: 'center',
                fontFamily: "'Orbitron', system-ui, sans-serif",
                fontSize: 22, fontWeight: 800,
                color: active ? '#000' : '#fff',
                background: active ? palette[0] : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? palette[0] : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 4,
                boxShadow: active ? crGlow(palette[0], 0.7) : 'none',
                cursor: 'pointer',
              }}>{n}</div>
            );
          })}
        </div>

        {/* Player avatars */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
          marginBottom: 28,
        }}>
          {Array.from({ length: 4 }).map((_, i) => {
            const active = i < playerCount;
            const c = palette[i];
            return (
              <div key={i} style={{
                padding: '14px 14px',
                border: `1px solid ${active ? c : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 4,
                background: active ? `${c}10` : 'rgba(255,255,255,0.02)',
                display: 'flex', alignItems: 'center', gap: 12,
                boxShadow: active ? `inset 0 0 16px ${c}25` : 'none',
                opacity: active ? 1 : 0.4,
              }}>
                <CRAtom size={20} color={c} />
                <div>
                  <div style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: 12, fontWeight: 800, letterSpacing: 2,
                    color: active ? c : '#fff',
                  }}>P{i + 1}</div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9, letterSpacing: 1.5, opacity: 0.6,
                  }}>{CR_PLAYER_NAMES[i]}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid size */}
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, letterSpacing: 3, opacity: 0.6, marginBottom: 12,
        }}>GRID SIZE</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 'auto' }}>
          {CR_GRID_OPTIONS.map(opt => {
            const active = opt.key === gridKey;
            return (
              <div key={opt.key} onClick={() => setGridKey(opt.key)} style={{
                flex: 1, padding: '14px 8px', textAlign: 'center',
                border: `1px solid ${active ? palette[1] : 'rgba(255,255,255,0.12)'}`,
                background: active ? `${palette[1]}15` : 'rgba(255,255,255,0.02)',
                borderRadius: 4, cursor: 'pointer',
              }}>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 12, fontWeight: 800, letterSpacing: 2,
                  color: active ? palette[1] : '#fff',
                }}>{opt.label}</div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10, opacity: 0.5, marginTop: 4,
                }}>{opt.cols}×{opt.rows}</div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 24 }}>
          <CRButton color={palette[2]} fullWidth onClick={onStart}>START</CRButton>
        </div>
      </div>
    </CRGridBg>
  );
}

// ── HUD player tab ────────────────────────────────────────
function CRPlayerTab({ idx, color, count, active, eliminated }) {
  return (
    <div style={{
      flex: 1,
      padding: '8px 4px 10px',
      borderTop: `2px solid ${active ? color : 'transparent'}`,
      background: active ? `${color}18` : 'transparent',
      boxShadow: active ? `inset 0 8px 16px -8px ${color}80` : 'none',
      textAlign: 'center',
      opacity: eliminated ? 0.25 : 1,
      transition: 'all 200ms',
      position: 'relative',
    }}>
      <div style={{
        fontFamily: "'Orbitron', sans-serif", fontWeight: 800,
        fontSize: 10, letterSpacing: 2, color,
        textShadow: active ? `0 0 6px ${color}` : 'none',
      }}>P{idx + 1}</div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 16, fontWeight: 700, color: '#fff',
        marginTop: 2,
      }}>{count}</div>
      {eliminated && (
        <div style={{
          position: 'absolute', top: '50%', left: 8, right: 8,
          height: 1, background: '#fff', opacity: 0.6,
        }} />
      )}
    </div>
  );
}

// ── WIN ───────────────────────────────────────────────────
function CRWinScreen({ winner, palette, onRematch, onHome }) {
  const c = palette[winner % palette.length];
  return (
    <CRGridBg pattern="grid">
      {/* radial winner glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 40%, ${c}40 0%, transparent 55%)`,
        animation: 'cr-pulse-bg 2s ease-in-out infinite',
      }} />
      {/* particles */}
      {Array.from({ length: 18 }).map((_, i) => {
        const angle = (i / 18) * 360;
        return (
          <div key={i} className="cr-celebrate" style={{
            position: 'absolute', top: '38%', left: '50%',
            '--cr-angle': `${angle}deg`,
            animationDelay: `${(i % 6) * 0.1}s`,
          }}>
            <CRAtom size={10} color={c} />
          </div>
        );
      })}

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '110px 32px 48px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, letterSpacing: 4, opacity: 0.6, marginBottom: 12,
          }}>// CRITICAL MASS ACHIEVED</div>
          <div style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 36, fontWeight: 900, letterSpacing: 6,
            color: c, textShadow: crGlow(c, 1.4),
          }}>VICTORY</div>
          <div style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 14, fontWeight: 700, letterSpacing: 4,
            marginTop: 12, opacity: 0.85,
          }}>P{winner + 1} · {CR_PLAYER_NAMES[winner]}</div>
        </div>

        <div style={{
          width: 140, height: 140, position: 'relative',
        }}>
          {/* trophy = giant atom */}
          <div className="cr-atom-spin" style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: `radial-gradient(circle at 30% 25%, #fff, ${c} 60%)`,
              boxShadow: crGlow(c, 2),
            }} />
          </div>
          {/* orbital ring */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: `1px solid ${c}55`,
            animation: 'cr-orbit 4s linear infinite',
          }} />
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <CRButton color={c} fullWidth onClick={onRematch}>REMATCH</CRButton>
          <CRButton color={palette[(winner + 1) % palette.length]} secondary fullWidth onClick={onHome}>HOME</CRButton>
        </div>
      </div>
    </CRGridBg>
  );
}

// ── PAUSE OVERLAY ─────────────────────────────────────────
function CRPauseOverlay({ onResume, onRestart, onQuit, palette, soundOn, setSoundOn }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(7,7,26,0.85)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 32, zIndex: 100,
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11, letterSpacing: 4, opacity: 0.5,
      }}>// REACTION HALTED</div>
      <div style={{
        fontFamily: "'Orbitron', sans-serif",
        fontSize: 32, fontWeight: 900, letterSpacing: 6,
        color: '#fff', marginTop: 8, marginBottom: 32,
        textShadow: `0 0 12px ${palette[0]}aa`,
      }}>PAUSED</div>

      <div style={{ width: '100%', maxWidth: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <CRButton color={palette[0]} fullWidth onClick={onResume}>RESUME</CRButton>
        <CRButton color={palette[1]} secondary fullWidth onClick={onRestart}>RESTART</CRButton>
        <CRButton color={palette[2]} secondary fullWidth onClick={onQuit}>QUIT TO HOME</CRButton>
        <div onClick={() => setSoundOn(!soundOn)} style={{
          marginTop: 12, padding: '10px 14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 2,
          cursor: 'pointer',
        }}>
          <span style={{ opacity: 0.7 }}>SOUND</span>
          <span style={{ color: soundOn ? palette[2] : '#fff', opacity: soundOn ? 1 : 0.4 }}>
            {soundOn ? 'ON ●' : 'OFF ○'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── TUTORIAL ──────────────────────────────────────────────
function CRTutorialScreen({ onClose, palette }) {
  const [step, setStep] = React.useState(0);
  const steps = [
    {
      title: 'TAP TO ADD',
      body: 'Tap an empty cell, or one of YOUR cells, to add an atom.',
      color: palette[0],
    },
    {
      title: 'CRITICAL MASS',
      body: 'Each cell holds up to (neighbors − 1) atoms. Wobble means it’s about to blow.',
      color: palette[3],
    },
    {
      title: 'EXPLODE!',
      body: 'At critical mass, a cell scatters one atom to each orthogonal neighbor.',
      color: palette[1],
    },
    {
      title: 'CHAIN REACTION',
      body: 'Explosions can trigger explosions. The longer the chain, the harder you hit.',
      color: palette[2],
    },
    {
      title: 'CAPTURE',
      body: 'Atoms landing on enemy cells convert them to your color. Eliminate everyone to win.',
      color: palette[0],
    },
  ];
  const s = steps[step];
  return (
    <CRGridBg pattern="grid">
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        padding: '60px 24px 40px',
      }}>
        <div onClick={onClose} style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
          letterSpacing: 2, opacity: 0.7, cursor: 'pointer', marginBottom: 24,
        }}>← BACK</div>

        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, letterSpacing: 3, opacity: 0.5,
        }}>// {String(step + 1).padStart(2, '0')} OF {String(steps.length).padStart(2, '0')}</div>
        <div style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: 24, fontWeight: 800, letterSpacing: 4,
          marginTop: 6, color: s.color,
          textShadow: `0 0 10px ${s.color}aa`,
        }}>{s.title}</div>

        {/* mini demo */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CRTutorialDemo step={step} palette={palette} />
        </div>

        <div style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 17, lineHeight: 1.45, marginBottom: 24,
          textWrap: 'pretty',
        }}>{s.body}</div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 24 : 6, height: 6,
              borderRadius: 4,
              background: i === step ? s.color : 'rgba(255,255,255,0.2)',
              boxShadow: i === step ? `0 0 8px ${s.color}` : 'none',
              transition: 'all 200ms',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <div style={{ flex: 1 }}>
              <CRButton color={palette[1]} secondary fullWidth small onClick={() => setStep(step - 1)}>BACK</CRButton>
            </div>
          )}
          <div style={{ flex: 2 }}>
            <CRButton color={s.color} fullWidth small onClick={() => {
              if (step < steps.length - 1) setStep(step + 1);
              else onClose();
            }}>
              {step < steps.length - 1 ? 'NEXT' : 'GOT IT'}
            </CRButton>
          </div>
        </div>
      </div>
    </CRGridBg>
  );
}

function CRTutorialDemo({ step, palette }) {
  // A tiny 3x3 board demo whose state advances per step.
  const cellSize = 56;
  const cells = [
    [{count:0,owner:null},{count:0,owner:null},{count:0,owner:null}],
    [{count:0,owner:null},{count:0,owner:null},{count:0,owner:null}],
    [{count:0,owner:null},{count:0,owner:null},{count:0,owner:null}],
  ];
  // Different states by step
  const state = [
    // 0 — tap to add: one cell with 1 atom
    () => { cells[1][1] = {count:1,owner:0}; },
    // 1 — critical soon: cell at center 3 atoms (interior=4, soon)
    () => { cells[1][1] = {count:3,owner:0}; },
    // 2 — explode: empty center, neighbors filled
    () => {
      cells[0][1] = {count:1,owner:0};
      cells[1][0] = {count:1,owner:0};
      cells[1][2] = {count:1,owner:0};
      cells[2][1] = {count:1,owner:0};
    },
    // 3 — chain: extra second-wave activity
    () => {
      cells[0][1] = {count:2,owner:0};
      cells[1][0] = {count:2,owner:0};
      cells[1][2] = {count:2,owner:0};
      cells[2][1] = {count:2,owner:0};
      cells[1][1] = {count:1,owner:0};
    },
    // 4 — capture: enemy converted
    () => {
      cells[0][0] = {count:1,owner:1};
      cells[1][1] = {count:2,owner:0};
      cells[2][2] = {count:1,owner:0}; // converted
    },
  ];
  state[step]();
  return (
    <div style={{
      position: 'relative', padding: 14,
      border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 6,
      background: 'rgba(255,255,255,0.02)',
    }}>
      {cells.map((row, r) => (
        <div key={r} style={{ display: 'flex' }}>
          {row.map((cell, c) => (
            <CRCell
              key={`${c},${r}`}
              c={c} r={r} cell={cell}
              cellSize={cellSize} shape="orb"
              palette={palette}
              criticalSoon={step === 1 && r === 1 && c === 1}
              exploding={false} justAdded={false}
              currentPlayerColor={palette[0]}
              onTap={() => {}}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, {
  CR_GRID_OPTIONS, CRGridBg, CRLogo, CRButton,
  CRHomeScreen, CRSetupScreen, CRPlayerTab,
  CRWinScreen, CRPauseOverlay, CRTutorialScreen, CRTutorialDemo,
});
