'use client'

import { useEffect, useState } from 'react'

interface CCTVHeaderProps {
  isFullscreen: boolean
  onFullscreenToggle: () => void
  cameraCount: number
  activeCount: number
}

export default function CCTVHeader({
  isFullscreen,
  onFullscreenToggle,
  cameraCount,
  activeCount,
}: CCTVHeaderProps) {
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
            SECUREVISION
          </span>
          <span style={{ fontSize: '8px', letterSpacing: '0.25em', color: 'oklch(0.4 0.08 145)' }}>
            DVR SYSTEM v2.1
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
          <StatusPill label="ONLINE" active={true} color="green" />
          <StatusPill label={`${activeCount}/${cameraCount} CAM`} active={true} color="amber" />
          <StatusPill label="REC" active={true} color="red" blink />
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
        <div className="ticker" style={{ fontSize: '9px', letterSpacing: '0.1em', color: 'oklch(0.42 0.09 145)', lineHeight: '18px' }}>
          {'>>> '}
          SECURITY ALERT LEVEL: NORMAL {'  ///  '}
          ALL SECTORS MONITORED {'  ///  '}
          MOTION DETECTION: ACTIVE {'  ///  '}
          PERIMETER STATUS: SECURE {'  ///  '}
          STORAGE: 2.4TB FREE {'  ///  '}
          LAST EVENT: NO ANOMALIES {'  ///  '}
          SYSTEM UPTIME: 72H 14M {'  <<<'}
        </div>
      </div>

      {/* Right: time + controls */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <div className="crt-text-amber" style={{ fontSize: '14px', letterSpacing: '0.08em', lineHeight: 1 }}>
            {time}
          </div>
          <div style={{ fontSize: '9px', letterSpacing: '0.08em', color: 'oklch(0.45 0.1 75)', lineHeight: 1, marginTop: 2 }}>
            {date}
          </div>
        </div>

        <button
          className="cctv-btn"
          onClick={onFullscreenToggle}
          style={{ fontSize: '9px' }}
        >
          {isFullscreen ? 'EXIT FULL' : 'FULLSCREEN'}
        </button>
      </div>
    </header>
  )
}

function StatusPill({
  label, active, color, blink
}: {
  label: string; active: boolean; color: 'green' | 'amber' | 'red'; blink?: boolean
}) {
  const colors = {
    green: 'oklch(0.68 0.22 145)',
    amber: 'oklch(0.75 0.18 75)',
    red: 'oklch(0.7 0.22 25)',
  }
  return (
    <div className="flex items-center gap-1">
      <div
        style={{
          width: 6, height: 6, borderRadius: '50%',
          background: active ? colors[color] : 'oklch(0.25 0.05 200)',
          boxShadow: active ? `0 0 4px ${colors[color]}` : undefined,
          animation: blink && active ? 'rec-pulse 1s ease-in-out infinite' : undefined,
        }}
      />
      <span style={{ fontSize: '8px', letterSpacing: '0.1em', color: active ? colors[color] : 'oklch(0.3 0.05 200)' }}>
        {label}
      </span>
    </div>
  )
}
