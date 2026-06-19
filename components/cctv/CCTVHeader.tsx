'use client'

import { useEffect, useState } from 'react'
import { useTheme, getCctvNow } from '@/lib/themeContext'

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
      const now = getCctvNow(settings)
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
  }, [settings])

  if (isFullscreen) return null

  const title = settings.customSystemTitle.trim() || t.systemTitle
  const subtitle = settings.customSystemSub.trim() || t.systemSub

  const headerBackground =
    settings.cameraSceneStyle === 'hq'
      ? 'linear-gradient(90deg, oklch(0.055 0.012 240), oklch(0.09 0.018 240))'
      : settings.cameraSceneStyle === 'police'
      ? 'linear-gradient(90deg, oklch(0.05 0.01 240), oklch(0.055 0.015 25))'
      : settings.cameraSceneStyle === 'privateHouse'
      ? 'linear-gradient(90deg, oklch(0.075 0.004 80), oklch(0.05 0.003 200))'
      : palette.bgCard

  return (
    <header
      className="flex items-center justify-between px-4 py-2 border-b scanlines"
      style={{
        borderColor: palette.border,
        background: headerBackground,
        minHeight: settings.cameraSceneStyle === 'privateHouse' ? '38px' : '42px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="flex items-center gap-4">
        <div className="flex flex-col leading-none">
          <span className="crt-text" style={{ fontSize: settings.cameraSceneStyle === 'privateHouse' ? '12px' : '14px', letterSpacing: '0.2em', fontWeight: 'bold' }}>
            {title}
          </span>
          <span style={{ fontSize: '8px', letterSpacing: '0.25em', color: palette.primaryDim }}>
            {subtitle}
          </span>
        </div>

        <div
          className="hidden md:flex items-center gap-1"
          style={{ height: '28px', borderLeft: `1px solid ${palette.borderDim}`, paddingLeft: '12px' }}
        >
          <span style={{ fontSize: '9px', letterSpacing: '0.1em', color: palette.primaryDim }}>
            SYS ID:
          </span>
          <span className="crt-text" style={{ fontSize: '9px', letterSpacing: '0.08em' }}>
            {sysId}
          </span>
        </div>

        {settings.showStatusPills && (
          <div className="hidden lg:flex items-center gap-3">
            <StatusPill label={t.online} active={true} color="theme" glow={settings.glow} palette={palette} />
            <StatusPill label={`${activeCount}/${cameraCount} CAM`} active={true} color="theme" glow={settings.glow} palette={palette} />
            <StatusPill label={t.rec} active={true} color="red" blink glow={settings.glow} palette={palette} />
          </div>
        )}
      </div>

      {settings.showTicker && (
        <div
          className="hidden md:block flex-1 mx-4 overflow-hidden"
          style={{
            height: '18px',
            borderTop: `1px solid ${palette.borderDim}`,
            borderBottom: `1px solid ${palette.borderDim}`,
          }}
        >
          <div className="ticker" style={{ fontSize: '9px', letterSpacing: '0.1em', color: palette.primaryDim, lineHeight: '18px' }}>
            {t.tickerFull}
          </div>
        </div>
      )}

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
  color: 'theme' | 'red'
  blink?: boolean
  glow?: boolean
  palette: { primary: string; primaryDim: string; textGlow: string }
}) {
  const dotColor = color === 'red' ? 'oklch(0.7 0.22 25)' : palette.primary
  const inactiveColor = 'oklch(0.3 0.05 200)'

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
      <span style={{ fontSize: '8px', letterSpacing: '0.1em', color: active ? dotColor : inactiveColor }}>
        {label}
      </span>
    </div>
  )
}
