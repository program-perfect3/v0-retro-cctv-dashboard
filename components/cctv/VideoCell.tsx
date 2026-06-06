'use client'

import { useEffect, useRef, useState } from 'react'
import NoSignal from './NoSignal'
import TimestampOverlay from './TimestampOverlay'

export type AspectRatioOption = '16/9' | '4/3' | '1/1' | '3/2' | 'auto'

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

const LOCATIONS = [
  'MAIN ENTRANCE', 'PARKING LOT A', 'SERVER ROOM', 'CORRIDOR B-4',
  'ROOF ACCESS', 'LOADING DOCK', 'RECEPTION', 'STAIRWELL 2',
  'EXIT GATE', 'PERIMETER E', 'STORAGE ROOM', 'LOBBY',
]

export default function VideoCell({ config, isFullscreen, onConfigChange }: VideoCellProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [glitchActive, setGlitchActive] = useState(false)

  const location = config.location || LOCATIONS[(config.id - 1) % LOCATIONS.length]

  useEffect(() => {
    if (!config.videoUrl) return
    const v = videoRef.current
    if (!v) return
    setLoaded(false)
    v.src = config.videoUrl
    v.load()
  }, [config.videoUrl])

  // Random glitch flicker
  useEffect(() => {
    const scheduleGlitch = () => {
      const delay = 8000 + Math.random() * 20000
      return setTimeout(() => {
        setGlitchActive(true)
        setTimeout(() => setGlitchActive(false), 150 + Math.random() * 300)
        scheduleGlitch()
      }, delay)
    }
    const t = scheduleGlitch()
    return () => clearTimeout(t)
  }, [])

  const hasVideo = !!config.videoUrl

  // CSS filter string
  const videoFilter = [
    `brightness(${config.brightness / 100})`,
    `contrast(${config.contrast / 100})`,
    config.fisheye ? 'saturate(0.85)' : '',
  ].filter(Boolean).join(' ')

  // Fisheye SVG filter id
  const fisheyeFilterId = `fisheye-${config.id}`

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-black group camera-cell"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* SVG fisheye filter definition */}
      {config.fisheye && (
        <svg width="0" height="0" className="absolute">
          <defs>
            <filter id={fisheyeFilterId} x="-10%" y="-10%" width="120%" height="120%">
              <feImage
                result="displacementMap"
                xlinkHref="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3CradialGradient id='g' cx='50%25' cy='50%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%23808000'/%3E%3Cstop offset='100%25' stop-color='%23808080'/%3E%3C/radialGradient%3E%3Crect width='100' height='100' fill='url(%23g)'/%3E%3C/svg%3E"
                x="0%" y="0%" width="100%" height="100%"
                preserveAspectRatio="xMidYMid slice"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="displacementMap"
                scale="40"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}

      {/* Main content */}
      {hasVideo ? (
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            onCanPlay={() => setLoaded(true)}
            className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${loaded ? 'opacity-100 video-fade-in' : 'opacity-0'}`}
            style={{
              objectFit: 'cover',
              objectPosition: 'center',
              filter: videoFilter,
              ...(config.fisheye
                ? { filter: `${videoFilter} url(#${fisheyeFilterId})` }
                : {}),
            }}
          />
          {/* Loading state — show static while video loads */}
          {!loaded && <NoSignal camId={config.id} label={config.label} />}
        </div>
      ) : (
        <NoSignal camId={config.id} label={config.label} />
      )}

      {/* CRT Overlay effects layer */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Scanlines */}
        <div
          className="absolute inset-0"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.10) 2px, rgba(0,0,0,0.10) 4px)',
          }}
        />

        {/* Noise */}
        {config.noiseIntensity > 0 && (
          <div
            className="noise-overlay"
            style={{ opacity: config.noiseIntensity / 100 * 0.12 }}
          />
        )}

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)' }}
        />

        {/* Glitch artifact */}
        {glitchActive && (
          <div
            className="absolute inset-0"
            style={{
              background: 'rgba(100,255,100,0.04)',
              clipPath: `inset(${Math.random() * 80}% 0 ${Math.random() * 10}% 0)`,
              transform: `translateX(${(Math.random() - 0.5) * 8}px)`,
            }}
          />
        )}

        {/* Interlace flicker lines */}
        <div
          className="absolute inset-0"
          style={{
            background: 'repeating-linear-gradient(180deg, transparent 0px, transparent 1px, rgba(0,0,0,0.03) 1px, rgba(0,0,0,0.03) 2px)',
            animation: 'interlace 0.1s infinite',
          }}
        />

        {/* CRT edge glow */}
        <div
          className="absolute inset-0"
          style={{
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)',
          }}
        />
      </div>

      {/* Timestamp overlay */}
      {hasVideo && loaded && (
        <TimestampOverlay
          camId={config.id}
          label={config.label}
          location={location}
          showRec
        />
      )}

      {/* Camera ID badge when no video */}
      {!hasVideo && (
        <div className="absolute top-2 left-2 z-20 cam-label">
          CAM {String(config.id).padStart(2, '0')} — {config.label}
        </div>
      )}

      {/* Drag handle indicator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <div style={{
          fontFamily: 'var(--font-share-tech-mono), monospace',
          fontSize: '9px',
          letterSpacing: '0.15em',
          color: 'oklch(0.68 0.18 145)',
          textShadow: '0 0 6px oklch(0.68 0.22 145 / 0.6)',
          background: 'rgba(0,0,0,0.7)',
          padding: '2px 6px',
          border: '1px solid oklch(0.35 0.1 145)',
        }}>
          DRAG
        </div>
      </div>

      {/* Glitch bar */}
      <div className="glitch-bar" />
    </div>
  )
}
