'use client'

import { useTheme, THEME_PALETTES, type ThemeColor, type Locale } from '@/lib/themeContext'

interface ThemeSettingsPanelProps {
  onClose: () => void
}

const COLORS: ThemeColor[] = ['green', 'amber', 'red', 'blue', 'white']

export default function ThemeSettingsPanel({ onClose }: ThemeSettingsPanelProps) {
  const { settings, update, t, palette } = useTheme()

  const p = palette

  // Reusable row
  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-3 py-1" style={{ borderBottom: `1px solid ${p.borderDim}` }}>
      <span style={{ fontSize: '9px', letterSpacing: '0.12em', color: p.primaryDim, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
        {label}
      </span>
      <div className="flex items-center gap-1.5 flex-shrink-0">{children}</div>
    </div>
  )

  const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) => (
    <button
      onClick={() => onChange(!value)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
      }}
      aria-pressed={value}
    >
      {/* LED indicator */}
      <div style={{
        width: 28,
        height: 13,
        borderRadius: 2,
        border: `1px solid ${value ? p.primary : p.primaryFaint}`,
        background: value ? `${p.primary}22` : `${p.bg}`,
        boxShadow: value ? `0 0 5px ${p.primary}88, inset 0 0 4px ${p.primary}44` : 'none',
        position: 'relative',
        transition: 'all 0.15s',
      }}>
        <div style={{
          position: 'absolute',
          top: 2,
          left: value ? 16 : 2,
          width: 7,
          height: 7,
          borderRadius: 1,
          background: value ? p.primary : p.primaryFaint,
          boxShadow: value ? `0 0 4px ${p.primary}` : 'none',
          transition: 'all 0.15s',
        }} />
      </div>
      {label && (
        <span style={{ fontSize: '8px', letterSpacing: '0.1em', color: value ? p.primary : p.primaryFaint }}>
          {label}
        </span>
      )}
    </button>
  )

  return (
    <div
      className="flex flex-col"
      style={{
        width: '100%',
        height: '100%',
        background: palette.bg,
        border: `1px solid ${p.border}`,
        boxShadow: `0 0 20px ${p.primary}33, inset 0 0 30px rgba(0,0,0,0.5)`,
        fontFamily: 'var(--font-share-tech-mono), monospace',
        overflow: 'hidden',
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-4 flex-shrink-0"
        style={{
          height: 38,
          borderBottom: `1px solid ${p.border}`,
          background: palette.bgCard,
        }}
      >
        <div className="flex items-center gap-3">
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.primary, boxShadow: `0 0 6px ${p.primary}` }} />
          <span style={{
            fontSize: '11px',
            letterSpacing: '0.22em',
            color: p.primary,
            textShadow: settings.glow ? p.textGlow : 'none',
          }}>
            {t.settingsTitle}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            fontSize: '9px',
            letterSpacing: '0.15em',
            color: p.primaryDim,
            background: 'none',
            border: `1px solid ${p.borderDim}`,
            padding: '2px 8px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {t.close} ×
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-0">

        {/* ── COLOUR THEME ── */}
        <div style={{ fontSize: '8px', letterSpacing: '0.2em', color: p.primaryFaint, paddingTop: 8, paddingBottom: 4 }}>
          — {t.colorTheme} —
        </div>

        <div className="flex flex-wrap gap-1.5 pb-3" style={{ borderBottom: `1px solid ${p.borderDim}` }}>
          {COLORS.map((c) => {
            const cp = THEME_PALETTES[c]
            const active = settings.color === c
            return (
              <button
                key={c}
                onClick={() => update({ color: c })}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 8px',
                  background: active ? `${cp.primary}18` : 'transparent',
                  border: `1px solid ${active ? cp.primary : cp.primaryFaint}`,
                  cursor: 'pointer',
                  boxShadow: active ? `0 0 8px ${cp.primary}55` : 'none',
                  transition: 'all 0.15s',
                  minWidth: 64,
                }}
              >
                {/* Color swatch */}
                <div style={{
                  width: 24,
                  height: 10,
                  background: cp.primary,
                  boxShadow: active ? `0 0 6px ${cp.primary}` : 'none',
                  borderRadius: 1,
                }} />
                <span style={{
                  fontSize: '7px',
                  letterSpacing: '0.08em',
                  color: active ? cp.primary : cp.primaryFaint,
                  fontFamily: 'var(--font-share-tech-mono), monospace',
                  textTransform: 'uppercase',
                }}>
                  {settings.locale === 'ru' ? cp.labelRu : cp.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── LANGUAGE ── */}
        <div style={{ fontSize: '8px', letterSpacing: '0.2em', color: p.primaryFaint, paddingTop: 8, paddingBottom: 4 }}>
          — {t.localeLabel} —
        </div>

        <div className="flex gap-1.5 pb-3" style={{ borderBottom: `1px solid ${p.borderDim}` }}>
          {(['ru', 'en'] as Locale[]).map((loc) => (
            <button
              key={loc}
              onClick={() => update({ locale: loc })}
              style={{
                padding: '3px 12px',
                fontSize: '9px',
                letterSpacing: '0.15em',
                fontFamily: 'var(--font-share-tech-mono), monospace',
                background: settings.locale === loc ? `${p.primary}20` : 'transparent',
                border: `1px solid ${settings.locale === loc ? p.primary : p.primaryFaint}`,
                color: settings.locale === loc ? p.primary : p.primaryFaint,
                cursor: 'pointer',
                boxShadow: settings.locale === loc ? `0 0 6px ${p.primary}44` : 'none',
              }}
            >
              {loc === 'ru' ? 'РУС' : 'ENG'}
            </button>
          ))}
        </div>

        {/* ── TEXT SIZE ── */}
        <div style={{ fontSize: '8px', letterSpacing: '0.2em', color: p.primaryFaint, paddingTop: 8, paddingBottom: 4 }}>
          — {t.textSize} —
        </div>

        <div className="flex items-center gap-3 pb-3" style={{ borderBottom: `1px solid ${p.borderDim}` }}>
          <span style={{ fontSize: '9px', color: p.primaryDim, minWidth: 22 }}>A</span>
          <div style={{ flex: 1, position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
            {/* Track */}
            <div style={{
              position: 'absolute',
              left: 0, right: 0, height: 2,
              background: p.borderDim,
            }} />
            {/* Fill */}
            <div style={{
              position: 'absolute',
              left: 0,
              width: `${((settings.textScale - 80) / 50) * 100}%`,
              height: 2,
              background: p.primary,
              boxShadow: settings.glow ? `0 0 4px ${p.primary}` : 'none',
            }} />
            <input
              type="range"
              min={80}
              max={130}
              step={5}
              value={settings.textScale}
              onChange={(e) => update({ textScale: Number(e.target.value) })}
              style={{
                position: 'relative',
                width: '100%',
                appearance: 'none',
                background: 'transparent',
                cursor: 'pointer',
                height: 20,
                outline: 'none',
              }}
            />
          </div>
          <span style={{ fontSize: '12px', color: p.primaryDim, minWidth: 22, textAlign: 'right' }}>A</span>
          <span style={{ fontSize: '8px', color: p.primary, minWidth: 30, textAlign: 'right' }}>
            {settings.textScale}%
          </span>
        </div>

        {/* ── GRID GAP ── */}
        <div style={{ fontSize: '8px', letterSpacing: '0.2em', color: p.primaryFaint, paddingTop: 8, paddingBottom: 4 }}>
          — {t.gridGap} —
        </div>

        <div className="flex items-center gap-3 pb-3" style={{ borderBottom: `1px solid ${p.borderDim}` }}>
          <div style={{ flex: 1, position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: p.borderDim }} />
            <div style={{
              position: 'absolute', left: 0,
              width: `${(settings.gridGap / 6) * 100}%`,
              height: 2, background: p.primary,
              boxShadow: settings.glow ? `0 0 4px ${p.primary}` : 'none',
            }} />
            <input
              type="range"
              min={0}
              max={6}
              step={1}
              value={settings.gridGap}
              onChange={(e) => update({ gridGap: Number(e.target.value) })}
              style={{ position: 'relative', width: '100%', appearance: 'none', background: 'transparent', cursor: 'pointer', height: 20, outline: 'none' }}
            />
          </div>
          <span style={{ fontSize: '8px', color: p.primary, minWidth: 36, textAlign: 'right' }}>
            {settings.gridGap}{t.px}
          </span>
        </div>

        {/* ── EFFECTS ── */}
        <div style={{ fontSize: '8px', letterSpacing: '0.2em', color: p.primaryFaint, paddingTop: 8, paddingBottom: 4 }}>
          — {t.effects} —
        </div>

        <Row label={t.scanlines}>
          <Toggle value={settings.scanlines} onChange={(v) => update({ scanlines: v })} />
        </Row>
        <Row label={t.noise}>
          <Toggle value={settings.noise} onChange={(v) => update({ noise: v })} />
        </Row>
        <Row label={t.glow}>
          <Toggle value={settings.glow} onChange={(v) => update({ glow: v })} />
        </Row>
        <Row label={t.flicker}>
          <Toggle value={settings.flicker} onChange={(v) => update({ flicker: v })} />
        </Row>
        <Row label={t.vignette}>
          <Toggle value={settings.vignette} onChange={(v) => update({ vignette: v })} />
        </Row>
        <Row label={t.timestamps}>
          <Toggle value={settings.timestampVisible} onChange={(v) => update({ timestampVisible: v })} />
        </Row>

        {/* Bottom padding */}
        <div style={{ height: 16 }} />
      </div>
    </div>
  )
}
