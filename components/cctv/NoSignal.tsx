'use client'

import { useEffect, useRef } from 'react'
import { useTheme, type CameraSceneStyle, type ThemeColor } from '@/lib/themeContext'

interface NoSignalProps {
  camId: number
  label: string
}

const STATIC_TINT: Record<ThemeColor, [number, number, number]> = {
  green: [120, 255, 160],
  amber: [255, 210, 90],
  red: [255, 95, 80],
  blue: [95, 155, 255],
  white: [220, 225, 230],
}

const EMPTY_COPY: Record<CameraSceneStyle, { prefix: string; detail: string; bg: string; vignette: string }> = {
  guard: {
    prefix: 'CH',
    detail: 'ANALOG INPUT SEARCH',
    bg: 'rgba(0,0,0,0.72)',
    vignette: 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.88) 100%)',
  },
  hq: {
    prefix: 'NODE',
    detail: 'FEED UNASSIGNED',
    bg: 'rgba(4,18,45,0.72)',
    vignette: 'radial-gradient(ellipse at center, transparent 56%, rgba(0,16,42,0.72) 100%)',
  },
  police: {
    prefix: 'КМР',
    detail: 'КАНАЛ НЕ НАЗНАЧЕН',
    bg: 'rgba(0,0,0,0.7)',
    vignette: 'radial-gradient(ellipse at center, transparent 46%, rgba(0,0,0,0.82) 100%)',
  },
  privateHouse: {
    prefix: 'HOME',
    detail: 'CAMERA OFFLINE',
    bg: 'rgba(30,20,8,0.7)',
    vignette: 'radial-gradient(ellipse at center, transparent 44%, rgba(0,0,0,0.78) 100%)',
  },
}

function hexToRgb(value: string): [number, number, number] | null {
  const match = value.match(/^#([0-9a-f]{6})$/i)
  if (!match) return null

  const hex = match[1]
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ]
}

export default function NoSignal({ camId, label }: NoSignalProps) {
  const { t, palette, settings } = useTheme()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timerRef = useRef<number | null>(null)
  const baseCopy = EMPTY_COPY[settings.cameraSceneStyle]
  const copy = { ...baseCopy, bg: palette.overlayBg || baseCopy.bg }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let cancelled = false
    const [tintR, tintG, tintB] = hexToRgb(settings.customColors.primary) ?? STATIC_TINT[settings.color]
    const drawInterval = settings.cameraSceneStyle === 'hq' ? 280 : settings.cameraSceneStyle === 'privateHouse' ? 180 : 120

    const draw = () => {
      if (cancelled) return

      const w = canvas.width
      const h = canvas.height

      // Random static noise tinted by selected CCTV theme colour.
      // Throttled to avoid burning CPU on empty grid cells.
      const imageData = ctx.createImageData(w, h)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255
        data[i] = v * (tintR / 255) * 0.55
        data[i + 1] = v * (tintG / 255) * 0.55
        data[i + 2] = v * (tintB / 255) * 0.55
        data[i + 3] = 255
      }

      ctx.putImageData(imageData, 0, 0)

      // Occasional horizontal sync artifact
      if (Math.random() < 0.08 && settings.cameraSceneStyle !== 'hq') {
        const y = Math.random() * h
        const lineH = Math.random() * 6 + 1
        ctx.fillStyle = `rgba(${tintR}, ${tintG}, ${tintB}, ${Math.random() * 0.15})`
        ctx.fillRect(0, y, w, lineH)
      }

      // Dark scanlines overlay
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 2)
      }

      timerRef.current = window.setTimeout(draw, drawInterval)
    }

    draw()
    return () => {
      cancelled = true
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [settings.color, settings.customColors.primary, settings.cameraSceneStyle])

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none" style={{ background: palette.cameraBg || undefined }}>
      {/* Static canvas */}
      <canvas
        ref={canvasRef}
        width={320}
        height={240}
        className="absolute inset-0 w-full h-full object-cover opacity-60"
      />

      {/* Dark overlay vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: copy.vignette }}
      />

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: settings.cameraSceneStyle === 'hq'
            ? 'linear-gradient(90deg, rgba(120,170,255,0.035) 1px, transparent 1px), linear-gradient(0deg, rgba(120,170,255,0.026) 1px, transparent 1px)'
            : 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)',
          backgroundSize: settings.cameraSceneStyle === 'hq' ? '24px 24px' : undefined,
        }}
      />

      {/* NO SIGNAL text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
        <div
          className="text-center"
          style={{
            fontFamily: 'var(--font-share-tech-mono), monospace',
            fontSize: 'clamp(10px, 2vw, 18px)',
            letterSpacing: '0.2em',
            color: palette.primary,
            textShadow: settings.glow ? palette.textGlow : 'none',
            background: copy.bg,
            padding: '2px 8px',
            border: settings.cameraSceneStyle === 'hq' ? `1px solid ${palette.borderDim}` : undefined,
          }}
        >
          {t.noSignal}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-share-tech-mono), monospace',
            fontSize: 'clamp(8px, 1.2vw, 11px)',
            letterSpacing: '0.15em',
            color: palette.primaryDim,
            background: copy.bg,
            padding: '2px 7px',
          }}
        >
          {copy.prefix} {String(camId).padStart(2, '0')} — {copy.detail}
        </div>
        {/* Animated bars */}
        {settings.cameraSceneStyle !== 'hq' && (
          <div className="flex gap-1 mt-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: 12,
                  background: palette.primaryDim,
                  animation: `blink ${0.5 + i * 0.15}s step-end infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Camera label bottom-left */}
      <div className="absolute bottom-2 left-2 z-20 cam-label">
        {label}
      </div>

      {/* Glitch bars */}
      {settings.cameraSceneStyle === 'guard' && <div className="glitch-bar" />}
    </div>
  )
}
