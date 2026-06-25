'use client'

import { useEffect, useRef } from 'react'
import { useTheme, getCctvNow, type CameraSceneStyle, type ThemeSettings } from '@/lib/themeContext'

interface TimestampOverlayProps {
  camId: number
  label: string
  location?: string
  showRec?: boolean
}

const SCENE_COPY: Record<CameraSceneStyle, {
  prefix: string
  rec: string
  framePrefix: string
  dateSeparator: string
  bg: string
}> = {
  guard: {
    prefix: 'CAM',
    rec: 'REC',
    framePrefix: 'F',
    dateSeparator: '/',
    bg: 'rgba(0,0,0,0.42)',
  },
  hq: {
    prefix: 'NODE',
    rec: 'LIVE',
    framePrefix: 'TC',
    dateSeparator: '.',
    bg: 'rgba(4,18,45,0.58)',
  },
  police: {
    prefix: 'КМР',
    rec: 'ЗАПИСЬ',
    framePrefix: 'КАДР',
    dateSeparator: '.',
    bg: 'rgba(0,0,0,0.5)',
  },
  privateHouse: {
    prefix: 'HOME',
    rec: 'LIVE',
    framePrefix: 'FR',
    dateSeparator: '/',
    bg: 'rgba(30,20,8,0.48)',
  },
}

type ClockSubscriber = () => void

const clockSubscribers = new Set<ClockSubscriber>()
let sharedClockTimer: number | null = null

function ensureSharedClock() {
  if (sharedClockTimer !== null) return

  sharedClockTimer = window.setInterval(() => {
    clockSubscribers.forEach((subscriber) => subscriber())
  }, 1000)
}

function subscribeToSharedClock(subscriber: ClockSubscriber) {
  clockSubscribers.add(subscriber)
  ensureSharedClock()

  return () => {
    clockSubscribers.delete(subscriber)

    if (clockSubscribers.size === 0 && sharedClockTimer !== null) {
      window.clearInterval(sharedClockTimer)
      sharedClockTimer = null
    }
  }
}

function getTimestampState(settings: ThemeSettings) {
  const now = getCctvNow(settings)
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  const s = String(now.getSeconds()).padStart(2, '0')
  const yr = now.getFullYear()
  const mo = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const sep = SCENE_COPY[settings.cameraSceneStyle].dateSeparator

  return {
    time: `${h}:${m}:${s}`,
    date: `${d}${sep}${mo}${sep}${yr}`,
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
  const dateRef = useRef<HTMLDivElement>(null)
  const timeRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const scene = SCENE_COPY[settings.cameraSceneStyle]
  const initialStamp = getTimestampState(settings)

  useEffect(() => {
    const writeStamp = () => {
      const stamp = getTimestampState(settings)

      if (dateRef.current) dateRef.current.textContent = stamp.date
      if (timeRef.current) timeRef.current.textContent = stamp.time
      if (frameRef.current) {
        frameRef.current.textContent = `${scene.framePrefix}:${String(stamp.frameCount).padStart(2, '0')}`
      }
    }

    writeStamp()
    return subscribeToSharedClock(writeStamp)
  }, [scene.framePrefix, settings])

  const labelStyle: React.CSSProperties = {
    background: scene.bg,
    padding: settings.cameraSceneStyle === 'hq' ? '2px 6px' : undefined,
    border: settings.cameraSceneStyle === 'hq' ? `1px solid ${palette.borderDim}` : undefined,
  }

  return (
    <>
      <div className="absolute top-2 left-2 z-20 flex flex-col gap-0.5">
        <div className="timestamp-overlay" style={labelStyle}>
          {scene.prefix} {String(camId).padStart(2, '0')} — {label}
        </div>
        <div className="timestamp-overlay" style={{ ...labelStyle, fontSize: '9px', color: palette.primaryDim, opacity: 0.85 }}>
          {location}
        </div>
      </div>

      {showRec && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
          <div className="rec-dot" />
          <span className="timestamp-overlay" style={{ color: 'oklch(0.75 0.22 25)', fontSize: settings.cameraSceneStyle === 'police' ? '9px' : '10px', background: scene.bg, padding: '1px 5px' }}>
            {scene.rec}
          </span>
        </div>
      )}

      <div className="absolute bottom-2 left-2 z-20">
        <div ref={dateRef} className="timestamp-overlay" style={{ background: scene.bg, padding: '1px 5px' }}>{initialStamp.date}</div>
      </div>

      <div className="absolute bottom-2 right-2 z-20 text-right">
        <div ref={timeRef} className="timestamp-overlay" style={{ background: scene.bg, padding: '1px 5px' }}>{initialStamp.time}</div>
        <div ref={frameRef} className="timestamp-overlay" style={{ fontSize: '9px', color: palette.primaryDim, opacity: 0.7, background: scene.bg, padding: '1px 5px' }}>
          {scene.framePrefix}:{String(initialStamp.frameCount).padStart(2, '0')}
        </div>
      </div>
    </>
  )
}
