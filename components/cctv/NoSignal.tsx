'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '@/lib/themeContext'

interface NoSignalProps {
  camId: number
  label: string
}

export default function NoSignal({ camId, label }: NoSignalProps) {
  const { t, palette, settings } = useTheme()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frame = 0

    const draw = () => {
      const w = canvas.width
      const h = canvas.height

      // Random static noise
      const imageData = ctx.createImageData(w, h)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255
        // Slight green tint to static
        data[i] = v * 0.3
        data[i + 1] = v * 0.55
        data[i + 2] = v * 0.3
        data[i + 3] = 255
      }

      ctx.putImageData(imageData, 0, 0)

      // Occasional horizontal sync artifact
      if (Math.random() < 0.08) {
        const y = Math.random() * h
        const lineH = Math.random() * 6 + 1
        ctx.fillStyle = `rgba(180, 255, 180, ${Math.random() * 0.15})`
        ctx.fillRect(0, y, w, lineH)
      }

      // Dark scanlines overlay
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 2)
      }

      frame++
      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none">
      {/* Static canvas */}
      <canvas
        ref={canvasRef}
        width={320}
        height={240}
        className="absolute inset-0 w-full h-full object-cover opacity-60"
      />

      {/* Dark overlay vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)' }}
      />

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)'
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
          }}
        >
          CH {String(camId).padStart(2, '0')} — {t.searching}
        </div>
        {/* Animated bars */}
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
      </div>

      {/* Camera label bottom-left */}
      <div className="absolute bottom-2 left-2 z-20 cam-label">
        {label}
      </div>

      {/* Glitch bars */}
      <div className="glitch-bar" />
    </div>
  )
}
