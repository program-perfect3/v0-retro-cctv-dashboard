'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/lib/themeContext'

interface CCTVHeaderProps {
  isFullscreen: boolean
  onFullscreenToggle: () => void
  cameraCount: number
  activeCount: number
  onSettingsToggle: () => void
  settingsOpen: boolean
}

export default function CCTVHeader({
  isFullscreen,
  onFullscreenToggle,
  cameraCount,
  activeCount,
  onSettingsToggle,
  settingsOpen,
}: CCTVHeaderProps) {
  const { t, settings, palette } = useTheme()
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')
  const [sysId, setSysId] = useState('----')

  useEffect(() => {
    setSysId(Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0'))
  }, [])

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const h = String(now.getHours()).padStart(2, '0')
      const m = String(now.getMinutes()).padStart(2, '0')
      const s = String(now.getSeconds()).padStart(2, '0')
      setTime(`${h}:${m}:${s}`)
      const yr = now.getFullYear()
      const mo = String(now.getMonth() + 1).padStart(2, '0')
      const d = String(now.getDate()).padStart(2, '0')
      setDate(`${d}.${mo}.${yr}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (isFullscreen) return null

  return (
    <header
      className="flex items-center justify-between px-4 py-2 border-b scanlines"
      style={{
        borderColor: 'oklch(0.22 0.05 145)',
        background: 'oklch(0.07 0.005 200)',
        minHeight: '42px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left: logo + system info */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col leading-none">
          <span className="crt-text" style={{ fontSize: '14px', letterSpacing: '0.2em', fontWeight: 'bold' }}>
            {t.systemTitle}
          </span>
          <span style={{ fontSize: '8px', letterSpacing: '0.25em', color: palette.primaryDim }}>
            {t.systemSub}
          </span>
        </div>

        <div
          className="hidden md:flex items-center gap-1"
          style={{ height: '28px', borderLeft: '1px solid oklch(0.22 0.05 145)', paddingLeft: '12px' }}
        >
          {/* System ID */}
          <span style={{ fontSize: '9px', letterSpacing: '0.1em', color: 'oklch(0.45 0.1 145)' }}>
            SYS ID:
          </span>
          <span className="crt-text-amber" style={{ fontSize: '9px', letterSpacing: '0.08em' }}>
            {sysId}
          </span>
        </div>

        {/* Status indicators */}
        <div className="hidden lg:flex items-center gap-3">
          <StatusPill label={t.online} active={true} color="green" glow={settings.glow} palette={palette} />
          <StatusPill label={`${activeCount}/${cameraCount} CAM`} active={true} color="amber" glow={settings.glow} palette={palette} />
          <StatusPill label={t.rec} active={true} color="red" blink glow={settings.glow} palette={palette} />
        </div>
      </div>

      {/* Center: ticker */}
      <div
        className="hidden md:block flex-1 mx-4 overflow-hidden"
        style={{
          height: '18px',
          borderTop: '1px solid oklch(0.18 0.04 145)',
          borderBottom: '1px solid oklch(0.18 0.04 145)',
        }}
      >
        <div className="ticker" style={{ fontSize: '9px', letterSpacing: '0.1em', color: palette.primaryDim, lineHeight: '18px' }}>
          {t.tickerFull}
        </div>
      </div>

      {/* Right: time + controls */}
      <div className="flex items-center gap-2">
        <div className="text-right hidden sm:block">
          <div style={{ fontSize: '14px', letterSpacing: '0.08em', lineHeight: 1, color: palette.primary, textShadow: settings.glow ? palette.textGlow : 'none' }}>
            {time}
          </div>
          <div style={{ fontSize: '9px', letterSpacing: '0.08em', color: palette.primaryDim, lineHeight: 1, marginTop: 2 }}>
            {date}
          </div>
        </div>

        <button
          className="cctv-btn"
          onClick={onSettingsToggle}
          style={{ fontSize: '9px', borderColor: settingsOpen ? palette.primary : undefined, color: settingsOpen ? palette.primary : undefined }}
          title={t.settingsTitle}
        >
          {settingsOpen ? '✕ ' : ''}{t.settings}
        </button>

        <button
          className="cctv-btn"
          onClick={onFullscreenToggle}
          style={{ fontSize: '9px' }}
        >
          {isFullscreen ? t.exitFull : t.fullscreen}
        </button>
      </div>
    </header>
  )
}

function StatusPill({
  label, active, color, blink, glow, palette
}: {
  label: string
  active: boolean
  color: 'green' | 'amber' | 'red'
  blink?: boolean
  glow?: boolean
  palette: { primary: string; primaryDim: string; textGlow: string }
}) {
  // Use theme primary for green, fixed amber/red for others
  const dotColor = color === 'green'
    ? palette.primary
    : color === 'amber'
    ? 'oklch(0.75 0.18 75)'
    : 'oklch(0.7 0.22 25)'

  return (
    <div className="flex items-center gap-1">
      <div
        style={{
          width: 6, height: 6, borderRadius: '50%',
          background: active ? dotColor : 'oklch(0.25 0.05 200)',
          boxShadow: active && glow ? `0 0 4px ${dotColor}` : undefined,
          animation: blink && active ? 'rec-pulse 1s ease-in-out infinite' : undefined,
        }}
      />
      <span style={{ fontSize: '8px', letterSpacing: '0.1em', color: active ? dotColor : 'oklch(0.3 0.05 200)' }}>
        {label}
      </span>
    </div>
  )
}
