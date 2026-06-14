'use client'

import { useRef } from 'react'
import type { CameraConfig, AspectRatioOption } from './VideoCell'
import { useTheme } from '@/lib/themeContext'

interface CameraSettingsProps {
  config: CameraConfig
  onChange: (patch: Partial<CameraConfig>) => void
  onClose: () => void
}

const ASPECT_OPTIONS: { value: AspectRatioOption; label: string }[] = [
  { value: 'auto', label: 'AUTO' },
  { value: '16/9', label: '16:9' },
  { value: '4/3', label: '4:3' },
  { value: '3/2', label: '3:2' },
  { value: '1/1', label: '1:1' },
  { value: '9/16', label: '9:16' },
]

export default function CameraSettings({ config, onChange, onClose }: CameraSettingsProps) {
  const { t, palette } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    onChange({ videoFile: file, videoUrl: url })
  }

  return (
    <div
      className="absolute inset-0 z-50 overflow-y-auto"
      style={{
        background: `${palette.bg}F5`,
        border: `1px solid ${palette.border}`,
        boxShadow: `0 0 20px color-mix(in oklch, ${palette.primary} 20%, transparent)`,
        fontFamily: 'var(--font-share-tech-mono), monospace',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: palette.border }}>
        <span className="crt-text" style={{ fontSize: '11px', letterSpacing: '0.12em' }}>
          CAM {String(config.id).padStart(2, '0')} {t.cfg}
        </span>
        <button className="cctv-btn cctv-btn-red" onClick={onClose} style={{ padding: '2px 8px' }}>
          {t.close}
        </button>
      </div>

      <div className="p-3 flex flex-col gap-3">
        {/* Label */}
        <div>
          <div className="panel-section-title">LABEL</div>
          <input
            className="cctv-input"
            value={config.label}
            maxLength={20}
            onChange={(e) => onChange({ label: e.target.value.toUpperCase() })}
            placeholder="CAM LABEL..."
          />
        </div>

        {/* Location */}
        <div>
          <div className="panel-section-title">LOCATION TAG</div>
          <input
            className="cctv-input"
            value={config.location}
            maxLength={24}
            onChange={(e) => onChange({ location: e.target.value.toUpperCase() })}
            placeholder="LOCATION..."
          />
        </div>

        {/* Aspect ratio */}
        <div>
          <div className="panel-section-title">ASPECT RATIO</div>
          <div className="flex gap-1 flex-wrap">
            {ASPECT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`cctv-btn ${config.aspectRatio === opt.value ? 'cctv-btn-amber' : ''}`}
                style={{ padding: '3px 8px' }}
                onClick={() => onChange({ aspectRatio: opt.value })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Video file */}
        <div>
          <div className="panel-section-title">VIDEO SOURCE</div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button className="cctv-btn w-full" onClick={() => fileInputRef.current?.click()}>
            {config.videoFile ? `LOADED: ${config.videoFile.name.slice(0, 20)}` : 'SELECT VIDEO FILE'}
          </button>
          {config.videoUrl && (
            <button
              className="cctv-btn cctv-btn-red w-full mt-1"
              onClick={() => onChange({ videoFile: null, videoUrl: null })}
            >
              CLEAR SOURCE
            </button>
          )}
        </div>

        {/* Brightness */}
        <div>
          <div className="panel-section-title">BRIGHTNESS: {config.brightness}%</div>
          <input
            type="range"
            min={40}
            max={160}
            value={config.brightness}
            onChange={(e) => onChange({ brightness: Number(e.target.value) })}
            className="w-full"
            style={{ accentColor: palette.primary }}
          />
        </div>

        {/* Contrast */}
        <div>
          <div className="panel-section-title">CONTRAST: {config.contrast}%</div>
          <input
            type="range"
            min={40}
            max={200}
            value={config.contrast}
            onChange={(e) => onChange({ contrast: Number(e.target.value) })}
            className="w-full"
            style={{ accentColor: palette.primary }}
          />
        </div>

        {/* Noise intensity */}
        <div>
          <div className="panel-section-title">NOISE: {config.noiseIntensity}%</div>
          <input
            type="range"
            min={0}
            max={100}
            value={config.noiseIntensity}
            onChange={(e) => onChange({ noiseIntensity: Number(e.target.value) })}
            className="w-full"
            style={{ accentColor: palette.primary }}
          />
        </div>

        {/* Fisheye toggle */}
        <div className="flex items-center justify-between">
          <span style={{ fontSize: '10px', letterSpacing: '0.1em', color: palette.primaryDim }}>
            FISHEYE LENS
          </span>
          <button
            className={`cctv-btn ${config.fisheye ? 'cctv-btn-amber' : ''}`}
            style={{ padding: '3px 12px' }}
            onClick={() => onChange({ fisheye: !config.fisheye })}
          >
            {config.fisheye ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  )
}
