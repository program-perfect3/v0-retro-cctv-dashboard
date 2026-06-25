'use client'

import { useEffect, useRef, useState } from 'react'
import NoSignal from './NoSignal'
import TimestampOverlay from './TimestampOverlay'
import { useTheme, type CameraSceneStyle } from '@/lib/themeContext'

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

type IdleWindow = Window & typeof globalThis & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
  cancelIdleCallback?: (handle: number) => void
}

const AR_MAP: Record<AspectRatioOption, [number, number] | null> = {
  'auto': null,
  '16/9': [16, 9],
  '4/3': [4, 3],
  '3/2': [3, 2],
  '1/1': [1, 1],
  '9/16': [9, 16],
}

const SCENE_LOOK: Record<CameraSceneStyle, {
  border: string
  radius: number
  bg: string
  video: string
  tint: string
  scanline: string
  noise: number
  vignette: string
  shadow: string
}> = {
  guard: {
    border: '1px solid color-mix(in oklch, var(--primary) 42%, black)',
    radius: 0,
    bg: 'oklch(0.018 0.004 145)',
    video: 'contrast(1.08) saturate(0.82) sepia(0.12)',
    tint: 'linear-gradient(90deg, rgba(0,255,120,0.03), transparent 50%, rgba(0,255,120,0.02))',
    scanline: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
    noise: 0.14,
    vignette: 'radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.76) 100%)',
    shadow: 'inset 0 0 28px rgba(0,0,0,0.72)',
  },
  hq: {
    border: '1px solid color-mix(in oklch, var(--primary) 58%, black)',
    radius: 2,
    bg: 'oklch(0.02 0.008 240)',
    video: 'contrast(1.16) saturate(1.05)',
    tint: 'linear-gradient(135deg, rgba(80,140,255,0.06), transparent 48%, rgba(255,255,255,0.02))',
    scanline: 'linear-gradient(90deg, rgba(120,170,255,0.035) 1px, transparent 1px), linear-gradient(0deg, rgba(120,170,255,0.026) 1px, transparent 1px)',
    noise: 0.035,
    vignette: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,16,42,0.48) 100%)',
    shadow: 'inset 0 0 14px rgba(0,0,0,0.35)',
  },
  police: {
    border: '1px solid color-mix(in oklch, var(--primary) 45%, oklch(0.32 0.13 25))',
    radius: 0,
    bg: 'oklch(0.024 0.004 220)',
    video: 'contrast(1.22) saturate(0.55) grayscale(0.22)',
    tint: 'linear-gradient(90deg, rgba(40,90,255,0.03), transparent 50%, rgba(255,40,40,0.03))',
    scanline: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 5px)',
    noise: 0.07,
    vignette: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.68) 100%)',
    shadow: 'inset 0 0 22px rgba(0,0,0,0.62)',
  },
  privateHouse: {
    border: '1px solid color-mix(in oklch, var(--primary) 28%, black)',
    radius: 6,
    bg: 'oklch(0.032 0.006 70)',
    video: 'contrast(0.96) saturate(0.86) sepia(0.18) brightness(1.03)',
    tint: 'linear-gradient(135deg, rgba(255,200,90,0.04), transparent 52%, rgba(255,255,255,0.012))',
    scanline: 'repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0,0,0,0.075) 4px, rgba(0,0,0,0.075) 6px)',
    noise: 0.1,
    vignette: 'radial-gradient(ellipse at center, transparent 48%, rgba(0,0,0,0.66) 100%)',
    shadow: 'inset 0 0 20px rgba(0,0,0,0.58)',
  },
}

function getVideoStartDelay(id: number, performanceMode: boolean) {
  const index = Math.max(0, id - 1)
  return performanceMode
    ? Math.min(index * 180, 2200)
    : Math.min(index * 45, 360)
}

export default function VideoCell({ config, isFullscreen, onConfigChange, performanceMode = false }: VideoCellProps) {
  const { settings, palette } = useTheme()
  const videoRef = useRef<HTMLVideoElement>(null)
  const cellRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [glitchActive, setGlitchActive] = useState(false)
  const [glitchStyle, setGlitchStyle] = useState<React.CSSProperties>({})
  const [cellSize, setCellSize] = useState<{ w: number; h: number } | null>(null)

  void onConfigChange

  const visualEffectsEnabled = !performanceMode
  const scene = SCENE_LOOK[settings.cameraSceneStyle]

  useEffect(() => {
    const v = videoRef.current
    setLoaded(false)

    if (!config.videoUrl || !v) return

    let cancelled = false
    let playTimer: number | null = null
    let idleHandle: number | null = null
    const idleWindow = window as IdleWindow

    v.muted = true
    v.defaultMuted = true
    v.loop = true
    v.playsInline = true
    v.controls = false
    v.disablePictureInPicture = true
    v.preload = performanceMode ? 'none' : 'metadata'

    const markLoaded = () => {
      if (!cancelled) setLoaded(true)
    }

    const startPlayback = () => {
      if (cancelled || document.hidden || !v.isConnected) return

      if (v.readyState === HTMLMediaElement.HAVE_NOTHING) {
        v.load()
      }

      void v.play().then(markLoaded).catch(() => {
        // Autoplay can still be blocked in embedded previews. Keep UI alive.
      })
    }

    const requestIdleStart = () => {
      if (cancelled) return

      if (performanceMode && typeof idleWindow.requestIdleCallback === 'function') {
        idleHandle = idleWindow.requestIdleCallback(startPlayback, { timeout: 1200 })
        return
      }

      startPlayback()
    }

    const schedulePlayback = (delay = getVideoStartDelay(config.id, performanceMode)) => {
      if (playTimer !== null) window.clearTimeout(playTimer)
      playTimer = window.setTimeout(requestIdleStart, delay)
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && v.paused) schedulePlayback(50)
    }

    v.addEventListener('loadeddata', markLoaded)
    v.addEventListener('canplay', markLoaded)
    v.addEventListener('playing', markLoaded)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    schedulePlayback()

    return () => {
      cancelled = true
      if (playTimer !== null) window.clearTimeout(playTimer)
      if (idleHandle !== null && typeof idleWindow.cancelIdleCallback === 'function') {
        idleWindow.cancelIdleCallback(idleHandle)
      }
      v.removeEventListener('loadeddata', markLoaded)
      v.removeEventListener('canplay', markLoaded)
      v.removeEventListener('playing', markLoaded)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      v.pause()
    }
  }, [config.id, config.videoUrl, performanceMode])

  useEffect(() => {
    if (config.aspectRatio === 'auto') {
      setCellSize(null)
      return
    }

    const el = cellRef.current
    if (!el) return

    let raf = 0
    const writeSize = (w: number, h: number) => {
      const next = { w: Math.round(w), h: Math.round(h) }
      setCellSize((prev) => (prev?.w === next.w && prev?.h === next.h ? prev : next))
    }

    writeSize(el.clientWidth, el.clientHeight)

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return

      if (raf) window.cancelAnimationFrame(raf)
      const { width, height } = entry.contentRect
      raf = window.requestAnimationFrame(() => {
        raf = 0
        writeSize(width, height)
      })
    })

    ro.observe(el)
    return () => {
      if (raf) window.cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [config.aspectRatio])

  useEffect(() => {
    if (!visualEffectsEnabled || settings.cameraSceneStyle === 'hq' || settings.cameraSceneStyle === 'privateHouse') return

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
  }, [palette.primary, settings.cameraSceneStyle, visualEffectsEnabled])

  const hasVideo = !!config.videoUrl

  const shouldApplyVideoFilter = visualEffectsEnabled && (
    config.fisheye || config.brightness !== 100 || config.contrast !== 100
  )

  const videoFilter = [
    visualEffectsEnabled ? scene.video : '',
    shouldApplyVideoFilter ? `brightness(${config.brightness / 100})` : '',
    shouldApplyVideoFilter ? `contrast(${config.contrast / 100})` : '',
    shouldApplyVideoFilter && config.fisheye ? 'saturate(0.8)' : '',
  ].filter(Boolean).join(' ') || undefined

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
      style={{
        background: scene.bg,
        border: scene.border,
        borderRadius: scene.radius,
        boxShadow: '0 0 12px rgba(0,0,0,0.55)',
      }}
      data-performance-mode={performanceMode ? 'true' : 'false'}
      data-camera-style={settings.cameraSceneStyle}
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
              loop
              muted
              defaultMuted
              playsInline
              preload={performanceMode ? 'none' : 'metadata'}
              disablePictureInPicture
              controls={false}
              onError={() => setLoaded(false)}
              className={`absolute inset-0 w-full h-full ${loaded ? 'video-fade-in' : 'opacity-0'}`}
              style={{
                objectFit: 'cover',
                objectPosition: 'center',
                filter: videoFilter,
                willChange: performanceMode ? 'auto' : 'transform, opacity',
                borderRadius: scene.radius,
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

        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10, borderRadius: scene.radius, overflow: 'hidden' }}>
          {visualEffectsEnabled && <div className="absolute inset-0" style={{ background: scene.tint }} />}

          {settings.scanlines && visualEffectsEnabled && (
            <div
              className="absolute inset-0"
              style={{
                background: scene.scanline,
                backgroundSize: settings.cameraSceneStyle === 'hq' ? '24px 24px' : undefined,
                animation: settings.flicker && settings.cameraSceneStyle === 'guard' ? 'interlace 0.1s infinite' : 'none',
              }}
            />
          )}

          {settings.noise && visualEffectsEnabled && config.noiseIntensity > 0 && (
            <div
              className="noise-overlay"
              style={{ opacity: (config.noiseIntensity / 100) * scene.noise }}
            />
          )}

          {settings.vignette && visualEffectsEnabled && (
            <div className="absolute inset-0" style={{ background: scene.vignette }} />
          )}

          {glitchActive && settings.flicker && visualEffectsEnabled && (
            <div className="absolute inset-0" style={glitchStyle} />
          )}

          {visualEffectsEnabled && (
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.012) 0%, transparent 3%, transparent 97%, rgba(255,255,255,0.012) 100%)' }}
            />
          )}

          <div className="absolute inset-0" style={{ boxShadow: performanceMode ? 'inset 0 0 8px rgba(0,0,0,0.45)' : scene.shadow }} />

          {settings.flicker && visualEffectsEnabled && settings.cameraSceneStyle === 'guard' && <div className="glitch-bar" />}
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
            background: settings.cameraSceneStyle === 'hq' ? 'rgba(7,20,45,0.75)' : 'rgba(0,0,0,0.65)',
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
