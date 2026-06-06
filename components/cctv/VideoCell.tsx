'use client'

import { useEffect, useRef, useState } from 'react'
import NoSignal from './NoSignal'
import TimestampOverlay from './TimestampOverlay'

export type AspectRatioOption = '16/9' | '4/3' | '1/1' | '3/2' | '9/16' | 'auto'

export interface CameraConfig {
  id: number
  label: string
  location: string
  videoFile: File | null
  videoUrl: string | null
  aspectRatio: AspectRatioOption
  brightness: number
  contrast: number
  fisheye: boolean
  noiseIntensity: number
}

interface VideoCellProps {
  config: CameraConfig
  isFullscreen: boolean
  onConfigChange: (id: number, patch: Partial<CameraConfig>) => void
}

// Maps aspect ratio key → [w, h] ratio numbers
const AR_MAP: Record<AspectRatioOption, [number, number] | null> = {
  'auto': null,
  '16/9': [16, 9],
  '4/3': [4, 3],
  '3/2': [3, 2],
  '1/1': [1, 1],
  '9/16': [9, 16],
}

export default function VideoCell({ config, isFullscreen, onConfigChange }: VideoCellProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const cellRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [glitchActive, setGlitchActive] = useState(false)
  const [glitchStyle, setGlitchStyle] = useState<React.CSSProperties>({})
  // Cell size for inner AR clipping
  const [cellSize, setCellSize] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    if (!config.videoUrl) {
      setLoaded(false)
      return
    }
    const v = videoRef.current
    if (!v) return
    setLoaded(false)
    v.src = config.videoUrl
    v.load()
  }, [config.videoUrl])

  // Measure cell for inner aspect-ratio clipping
  useEffect(() => {
    const el = cellRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCellSize({ w: entry.contentRect.width, h: entry.contentRect.height })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Random glitch flicker
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const scheduleGlitch = () => {
      const delay = 7000 + Math.random() * 18000
      timer = setTimeout(() => {
        const clipY1 = Math.random() * 80
        const clipY2 = clipY1 + Math.random() * 15 + 2
        const tx = (Math.random() - 0.5) * 10
        setGlitchStyle({
          clipPath: `inset(${clipY1}% 0 ${100 - clipY2}% 0)`,
          transform: `translateX(${tx}px)`,
          background: `rgba(${Math.random() > 0.5 ? '100,255,100' : '255,255,100'},0.06)`,
        })
        setGlitchActive(true)
        setTimeout(() => {
          setGlitchActive(false)
          scheduleGlitch()
        }, 80 + Math.random() * 250)
      }, delay)
    }
    scheduleGlitch()
    return () => clearTimeout(timer)
  }, [])

  const hasVideo = !!config.videoUrl

  const videoFilter = [
    `brightness(${config.brightness / 100})`,
    `contrast(${config.contrast / 100})`,
    config.fisheye ? 'saturate(0.8)' : '',
  ].filter(Boolean).join(' ')

  const fisheyeId = `fisheye-${config.id}`

  // Compute inner clip rect for non-auto aspect ratio
  // The cell is cellSize.w × cellSize.h.
  // We want to show a window of the target AR centered in the cell,
  // letterboxing with black bars OR cropping — here we CROP so no bars appear.
  // So we compute the largest rect of target AR that fits inside the cell.
  let innerStyle: React.CSSProperties = { position: 'absolute', inset: 0 }
  if (config.aspectRatio !== 'auto' && cellSize) {
    const ar = AR_MAP[config.aspectRatio]
    if (ar) {
      const [arW, arH] = ar
      const cellAR = cellSize.w / cellSize.h
      const targetAR = arW / arH
      let iw: number, ih: number
      if (targetAR > cellAR) {
        // target is wider — constrain by width
        iw = cellSize.w
        ih = cellSize.w / targetAR
      } else {
        // target is taller — constrain by height
        ih = cellSize.h
        iw = cellSize.h * targetAR
      }
      const left = (cellSize.w - iw) / 2
      const top = (cellSize.h - ih) / 2
      innerStyle = {
        position: 'absolute',
        left,
        top,
        width: iw,
        height: ih,
        overflow: 'hidden',
      }
    }
  }

  return (
    <div
      ref={cellRef}
      className="relative w-full h-full overflow-hidden bg-black group"
      style={{ background: 'oklch(0.025 0.002 200)' }}
    >
      {/* SVG fisheye filter */}
      {config.fisheye && (
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
          <defs>
            <filter id={fisheyeId} x="-15%" y="-15%" width="130%" height="130%">
              <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="1" result="warp" />
              <feDisplacementMap
                in="SourceGraphic"
                in2="warp"
                scale="0"
                xChannelSelector="R"
                yChannelSelector="G"
                result="displaced"
              />
              <feColorMatrix
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"
              />
            </filter>
          </defs>
        </svg>
      )}

      {/* Black letterbox background — always black, never shows through */}
      <div className="absolute inset-0" style={{ background: '#000' }} />

      {/* Inner content box — fills cell or is cropped to target AR */}
      <div style={innerStyle}>
        {hasVideo ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              onCanPlay={() => setLoaded(true)}
              className={`absolute inset-0 w-full h-full ${loaded ? 'video-fade-in' : 'opacity-0'}`}
              style={{
                objectFit: 'cover',
                objectPosition: 'center',
                filter: config.fisheye ? `${videoFilter} url(#${fisheyeId})` : videoFilter,
                // fisheye barrel distortion via scale + border-radius trick
                ...(config.fisheye ? {
                  transform: 'scale(1.08)',
                  borderRadius: '50%',
                  clipPath: 'none',
                } : {}),
              }}
            />
            {!loaded && <NoSignal camId={config.id} label={config.label} />}
          </>
        ) : (
          <NoSignal camId={config.id} label={config.label} />
        )}

        {/* CRT effects layer — always inside the inner box */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
          {/* Interlaced scanlines */}
          <div
            className="absolute inset-0"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.13) 2px, rgba(0,0,0,0.13) 4px)',
              animation: 'interlace 0.1s infinite',
            }}
          />

          {/* Noise */}
          {config.noiseIntensity > 0 && (
            <div
              className="noise-overlay"
              style={{ opacity: (config.noiseIntensity / 100) * 0.14 }}
            />
          )}

          {/* Vignette */}
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.72) 100%)' }}
          />

          {/* Glitch artifact */}
          {glitchActive && (
            <div className="absolute inset-0" style={glitchStyle} />
          )}

          {/* Horizontal roll artifact */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.012) 0%, transparent 3%, transparent 97%, rgba(255,255,255,0.012) 100%)',
            }}
          />

          {/* Inner CRT edge shadow */}
          <div
            className="absolute inset-0"
            style={{ boxShadow: 'inset 0 0 24px rgba(0,0,0,0.6)' }}
          />

          {/* Glitch bar */}
          <div className="glitch-bar" />
        </div>

        {/* Timestamps — only when loaded */}
        {hasVideo && loaded && (
          <TimestampOverlay
            camId={config.id}
            label={config.label}
            location={config.location}
            showRec
          />
        )}

        {/* Camera ID when no video */}
        {!hasVideo && (
          <div className="absolute top-1.5 left-2 z-20 cam-label">
            {config.label}
          </div>
        )}
      </div>

      {/* Drag hint shown on hover */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{ background: 'rgba(0,0,0,0)' }}
      >
        <div
          style={{
            fontFamily: 'var(--font-share-tech-mono), monospace',
            fontSize: '9px',
            letterSpacing: '0.15em',
            color: 'oklch(0.68 0.18 145)',
            textShadow: '0 0 6px oklch(0.68 0.22 145 / 0.6)',
            background: 'rgba(0,0,0,0.65)',
            padding: '2px 7px',
            border: '1px solid oklch(0.35 0.1 145)',
            pointerEvents: 'none',
          }}
        >
          DRAG
        </div>
      </div>
    </div>
  )
}
