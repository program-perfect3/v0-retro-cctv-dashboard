'use client'

import { useEffect, useState } from 'react'
import { useTheme, getCctvNow, type ThemeSettings } from '@/lib/themeContext'

interface TimestampOverlayProps {
  camId: number
  label: string
  location?: string
  showRec?: boolean
}

function getTimestampState(settings: ThemeSettings) {
  const now = getCctvNow(settings)
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  const s = String(now.getSeconds()).padStart(2, '0')
  const yr = now.getFullYear()
  const mo = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')

  return {
    time: `${h}:${m}:${s}`,
    date: `${d}/${mo}/${yr}`,
    frameCount: now.getSeconds() % 30,
  }
}

export default function TimestampOverlay({
  camId,
  label,
  location = 'LOC UNKNOWN',
  showRec = true,
}: TimestampOverlayProps) {
  const { palette, settings } = useTheme()
  const [stamp, setStamp] = useState(() => getTimestampState(settings))

  useEffect(() => {
    const tick = () => setStamp(getTimestampState(settings))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [settings])

  return (
    <>
      <div className="absolute top-2 left-2 z-20 flex flex-col gap-0.5">
        <div className="timestamp-overlay">
          CAM {String(camId).padStart(2, '0')} — {label}
        </div>
        <div className="timestamp-overlay" style={{ fontSize: '9px', color: palette.primaryDim, opacity: 0.85 }}>
          {location}
        </div>
      </div>

      {showRec && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
          <div className="rec-dot" />
          <span className="timestamp-overlay" style={{ color: 'oklch(0.75 0.22 25)', fontSize: '10px' }}>
            REC
          </span>
        </div>
      )}

      <div className="absolute bottom-2 left-2 z-20">
        <div className="timestamp-overlay">{stamp.date}</div>
      </div>

      <div className="absolute bottom-2 right-2 z-20 text-right">
        <div className="timestamp-overlay">{stamp.time}</div>
        <div className="timestamp-overlay" style={{ fontSize: '9px', color: palette.primaryDim, opacity: 0.7 }}>
          F:{String(stamp.frameCount).padStart(2, '0')}
        </div>
      </div>
    </>
  )
}
