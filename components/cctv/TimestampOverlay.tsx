'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/lib/themeContext'

interface TimestampOverlayProps {
  camId: number
  label: string
  location?: string
  showRec?: boolean
}

export default function TimestampOverlay({
  camId,
  label,
  location = 'LOC UNKNOWN',
  showRec = true,
}: TimestampOverlayProps) {
  const { palette } = useTheme()
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')
  const [frameCount, setFrameCount] = useState(0)

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const h = String(now.getHours()).padStart(2, '0')
      const m = String(now.getMinutes()).padStart(2, '0')
      const s = String(now.getSeconds()).padStart(2, '0')
      const ms = String(now.getMilliseconds()).padStart(3, '0').slice(0, 2)
      setTime(`${h}:${m}:${s}:${ms}`)

      const yr = now.getFullYear()
      const mo = String(now.getMonth() + 1).padStart(2, '0')
      const d = String(now.getDate()).padStart(2, '0')
      setDate(`${d}/${mo}/${yr}`)
      setFrameCount((f) => (f + 1) % 30)
    }

    tick()
    const id = setInterval(tick, 33)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      {/* Top-left: camera id + label */}
      <div className="absolute top-2 left-2 z-20 flex flex-col gap-0.5">
        <div className="timestamp-overlay">
          CAM {String(camId).padStart(2, '0')} — {label}
        </div>
        <div className="timestamp-overlay" style={{ fontSize: '9px', color: palette.primaryDim, opacity: 0.85 }}>
          {location}
        </div>
      </div>

      {/* Top-right: REC dot + frame */}
      {showRec && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
          <div className="rec-dot" />
          <span className="timestamp-overlay" style={{ color: 'oklch(0.75 0.22 25)', fontSize: '10px' }}>
            REC
          </span>
        </div>
      )}

      {/* Bottom-left: date */}
      <div className="absolute bottom-2 left-2 z-20">
        <div className="timestamp-overlay">{date}</div>
      </div>

      {/* Bottom-right: time + frame number */}
      <div className="absolute bottom-2 right-2 z-20 text-right">
        <div className="timestamp-overlay">{time}</div>
        <div className="timestamp-overlay" style={{ fontSize: '9px', color: palette.primaryDim, opacity: 0.7 }}>
          F:{String(frameCount).padStart(2, '0')}
        </div>
      </div>
    </>
  )
}
