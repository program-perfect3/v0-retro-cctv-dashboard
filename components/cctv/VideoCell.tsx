'use client'

import { useEffect, useRef, useState } from 'react'
import NoSignal from './NoSignal'
import TimestampOverlay from './TimestampOverlay'
import { useTheme } from '@/lib/themeContext'

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
  performanceMode?: boolean
}

const AR_MAP: Record<AspectRatioOption, [number, number] | null> = {
  'auto': null,
  '16/9': [16, 9],
  '4/3': [4, 3],
  '3/2': [3, 2],
  '1/1': [1, 1],
  '9/16': [9, 16],
}

export default function VideoCell({ config, isFullscreen, onConfigChange, performanceMode = false }: VideoCellProps) {
  const { settings, palette } = useTheme()
  const videoRef = useRef<HTMLVideoElement>(null)
  const cellRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [glitchActive, setGlitchActive] = useState(false)
  const [glitchStyle, setGlitchStyle] = useState<React.CSSProperties>({})
  const [cellSize, setCellSize] = useState<{ w: number; h: number } | null>(null)

  const visualEffectsEnabled = !performanceMode

  useEffect(() => {
    const v = videoRef.current
    setLoaded(false)

    if (!config.videoUrl || !v) return

    let cancelled = false
    let playTimer: number | null = null

    v.muted = true
    v.defaultMuted = true
    v.loop = true
    v.playsInline = true
    v.controls = false
    v.disablePictureInPicture = true

    const playVideo = () => {
      if (cancelled || document.hidden) return
      void v.play().catch(() => {})
    }

    const markLoaded = () => {
      if (cancelled) return
      setLoaded(true)
      playVideo()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) playVideo()
    }

    v.addEventListener('loadeddata', markLoaded)
    v.addEventListener('canplay', markLoaded)
    v.addEventListener('playing', markLoaded)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    playTimer = window.setTimeout(playVideo, 0)

    return () => {
      cancelled = true
      if (playTimer !== null) window.clearTimeout(playTimer)
      v.removeEventListener('loadeddata', markLoaded)
      v.removeEventListener('canplay', markLoaded)
      v.removeEventListener('playing', markLoaded)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      v.pause()
    }
  }, [config.videoUrl])

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

  useEffect(() => {
    if (!visualEffectsEnabled) return

    let timer: ReturnType<typeof setTimeout>
    let shortTimer: ReturnType<typeof setTimeout> | null = null
    const scheduleGlitch = () => {
      const delay = 7000 + Math.random() * 18000
      timer = setTimeout(() => {
        const clipY1 = Math.random() * 80
        const clipY2 = clipY1 + Math.random() * 15 + 2
        const tx = (Math.random() - 0.5) * 10
        setGlitchStyle({
          clipPath: `inset(${clipY1}% 0 ${100 - clipY2}% 0)`,
          transform: `translateX(${tx}px)`,
          background: `color-mix(in oklch, ${palette.primary} 8%, transparent)`,
        })
        setGlitchActive(true)
        shortTimer = setTimeout(() => {
          setGlitchActive(false)
          scheduleGlitch()
        }, 80 + Math.random() * 250)
      }, delay)
    }
    scheduleGlitch()
    return () => {
      clearTimeout(timer)
      if (shortTimer) clearTimeout(shortTimer)
    }
  }, [palette.primary, visualEffectsEnabled])

  const hasVideo = !!config.videoUrl

  const shouldApplyVideoFilter = visualEffectsEnabled && (
    config.fisheye || config.brightness !== 100 || config.contrast !== 100
  )

  const videoFilter = shouldApplyVideoFilter
    ? [
        `brightness(${config.brightness / 100})`,
        `contrast(${config.contrast / 100})`,
        config.fisheye ? 'saturate(0.8)' : '',
      ].filter(Boolean).join(' ')
    : undefined

  const fisheyeId = `fisheye-${config.id}`

  let innerStyle: React.CSSProperties = { position: 'absolute', inset: 0 }
  if (config.aspectRatio !== 'auto' && cellSize) {
    const ar = AR_MAP[config.aspectRatio]
    if (ar) {
      const [arW, arH] = ar
      const cellAR = cellSize.w / cellSize.h
      const targetAR = arW / arH
      let iw: number, ih: number
      if (targetAR > cellAR) {
        iw = cellSize.w
        ih = cellSize.w / targetAR
      } else {
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
      data-performance-mode={performanceMode ? 'true' : 'false'}
    >
      {config.fisheye && visualEffectsEnabled && (
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

      <div className="absolute inset-0" style={{ background: '#000' }} />

      <div style={innerStyle}>
        {hasVideo ? (
          <>
            <video
              ref={videoRef}
              src={config.videoUrl ?? undefined}
              autoPlay
              loop
              muted
              defaultMuted
              playsInline
              preload={performanceMode ? 'metadata' : 'auto'}
              disablePictureInPicture
              controls={false}
              onLoadedData={() => setLoaded(true)}
              onCanPlay={() => {
                setLoaded(true)
                void videoRef.current?.play().catch(() => {})
              }}
              onPlaying={() => setLoaded(true)}
              onError={() => setLoaded(false)}
              className={`absolute inset-0 w-full h-full ${loaded ? 'video-fade-in' : 'opacity-0'}`}
              style={{
                objectFit: 'cover',
                objectPosition: 'center',
                filter: videoFilter,
                willChange: performanceMode ? 'auto' : 'transform, opacity',
                ...(config.fisheye && visualEffectsEnabled ? {
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

        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
          {settings.scanlines && visualEffectsEnabled && (
            <div
              className="absolute inset-0"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.13) 2px, rgba(0,0,0,0.13) 4px)',
                animation: settings.flicker ? 'interlace 0.1s infinite' : 'none',
              }}
            />
          )}

          {settings.noise && visualEffectsEnabled && config.noiseIntensity > 0 && (
            <div
              className="noise-overlay"
              style={{ opacity: (config.noiseIntensity / 100) * 0.14 }}
            />
          )}

          {settings.vignette && visualEffectsEnabled && (
            <div
              className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.72) 100%)' }}
            />
          )}

          {glitchActive && settings.flicker && visualEffectsEnabled && (
            <div className="absolute inset-0" style={glitchStyle} />
          )}

          {visualEffectsEnabled && (
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.012) 0%, transparent 3%, transparent 97%, rgba(255,255,255,0.012) 100%)',
              }}
            />
          )}

          <div
            className="absolute inset-0"
            style={{ boxShadow: performanceMode ? 'inset 0 0 8px rgba(0,0,0,0.45)' : 'inset 0 0 24px rgba(0,0,0,0.6)' }}
          />

          {settings.flicker && visualEffectsEnabled && <div className="glitch-bar" />}
        </div>

        {hasVideo && loaded && settings.timestampVisible && (
          <TimestampOverlay
            camId={config.id}
            label={config.label}
            location={config.location}
            showRec
          />
        )}

        {!hasVideo && (
          <div className="absolute top-1.5 left-2 z-20 cam-label">
            {config.label}
          </div>
        )}
      </div>

      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{ background: 'rgba(0,0,0,0)' }}
      >
        <div
          style={{
            fontFamily: 'var(--font-share-tech-mono), monospace',
            fontSize: '9px',
            letterSpacing: '0.15em',
            color: palette.primary,
            textShadow: settings.glow ? palette.textGlow : 'none',
            background: 'rgba(0,0,0,0.65)',
            padding: '2px 7px',
            border: `1px solid ${palette.border}`,
            pointerEvents: 'none',
          }}
        >
          DRAG
        </div>
      </div>
    </div>
  )
}
