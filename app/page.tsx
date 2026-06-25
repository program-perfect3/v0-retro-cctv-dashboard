'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import CCTVGrid from '@/components/cctv/CCTVGrid'
import CCTVHeader from '@/components/cctv/CCTVHeader'
import ControlPanel from '@/components/cctv/ControlPanel'
import ThemeSettingsPanel from '@/components/cctv/ThemeSettingsPanel'
import { CCTV_RESET_EVENT, useTheme } from '@/lib/themeContext'
import type { GridConfig } from '@/components/cctv/CCTVGrid'

function getAutoGrid(count: number): { cols: number; rows: number } {
  if (count <= 1) return { cols: 1, rows: 1 }
  if (count <= 2) return { cols: 2, rows: 1 }
  if (count <= 4) return { cols: 2, rows: 2 }
  if (count <= 6) return { cols: 3, rows: 2 }
  if (count <= 9) return { cols: 3, rows: 3 }
  if (count <= 12) return { cols: 4, rows: 3 }
  return { cols: 4, rows: 4 }
}

const DEFAULT_GRID: GridConfig = { layout: '2x2', cols: 2, rows: 2 }
const GRID_STORAGE_KEY = 'cctv.grid.config.v1'
const GRID_LAYOUTS = new Set(['1x1', '2x2', '3x3', '4x4', '2x3', '3x2', '4x3', 'auto', 'custom'])

function sanitizeGridConfig(value: unknown): GridConfig {
  if (!value || typeof value !== 'object') return DEFAULT_GRID
  const raw = value as Partial<GridConfig>
  const cols = Math.max(1, Math.min(8, Number(raw.cols) || DEFAULT_GRID.cols))
  const rows = Math.max(1, Math.min(8, Number(raw.rows) || DEFAULT_GRID.rows))
  const layout = GRID_LAYOUTS.has(String(raw.layout)) ? raw.layout as GridConfig['layout'] : DEFAULT_GRID.layout

  if (layout === 'auto') return { layout, cols: 0, rows: 0 }
  return { layout, cols, rows }
}

function readStoredGridConfig(): GridConfig {
  if (typeof window === 'undefined') return DEFAULT_GRID
  try {
    const raw = window.localStorage.getItem(GRID_STORAGE_KEY)
    return raw ? sanitizeGridConfig(JSON.parse(raw)) : DEFAULT_GRID
  } catch {
    return DEFAULT_GRID
  }
}

export default function CctvPage() {
  const { settings, update, palette } = useTheme()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [gridConfig, setGridConfig] = useState<GridConfig>(DEFAULT_GRID)
  const [folderVideos, setFolderVideos] = useState<File[]>([])
  const gridHydratedRef = useRef(false)

  useEffect(() => {
    gridHydratedRef.current = true
    setGridConfig(readStoredGridConfig())
  }, [])

  useEffect(() => {
    if (!gridHydratedRef.current) return
    window.localStorage.setItem(GRID_STORAGE_KEY, JSON.stringify(gridConfig))
  }, [gridConfig])

  useEffect(() => {
    const resetLocalSettings = () => {
      window.localStorage.removeItem(GRID_STORAGE_KEY)
      setGridConfig(DEFAULT_GRID)
      setFolderVideos([])
      setShowSettings(false)
    }

    window.addEventListener(CCTV_RESET_EVENT, resetLocalSettings)
    return () => window.removeEventListener(CCTV_RESET_EVENT, resetLocalSettings)
  }, [])

  const handleGridChange = useCallback((cfg: GridConfig) => {
    setGridConfig(sanitizeGridConfig(cfg))
  }, [])

  const cameraCount =
    gridConfig.layout === 'auto'
      ? (() => {
          const base = folderVideos.length > 0 ? folderVideos.length : 4
          const g = getAutoGrid(base)
          return Math.max(g.cols * g.rows, 1)
        })()
      : gridConfig.cols * gridConfig.rows

  const activeCount = Math.min(folderVideos.length, cameraCount)

  // Listen to native browser fullscreen changes
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const handleFullscreenToggle = useCallback(async () => {
    if (!isFullscreen) {
      try {
        await document.documentElement.requestFullscreen()
      } catch {
        /* iframe may block — use CSS-only fullscreen fallback */
      }
      setIsFullscreen(true)
    } else {
      try {
        if (document.fullscreenElement) await document.exitFullscreen()
      } catch { /* noop */ }
      setIsFullscreen(false)
    }
  }, [isFullscreen])

  // Escape key exits fullscreen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isFullscreen])

  const hiddenPanelCount = Number(!settings.showTopPanel) + Number(!settings.showBottomPanel)

  return (
    <div
      id="cctv-app"
      className="flex flex-col"
      style={{
        height: 'calc(100dvh * var(--ui-zoom-inverse, 1))',
        width: 'calc(100dvw * var(--ui-zoom-inverse, 1))',
        background: palette.bg,
        overflow: 'hidden',
        position: 'fixed',
        inset: 0,
        transform: 'scale(var(--ui-zoom, 1))',
        transformOrigin: 'top left',
      }}
    >
      {/* Global CRT outer vignette */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          boxShadow: 'inset 0 0 120px rgba(0,0,0,0.75)',
          pointerEvents: 'none',
        }}
      />

      {/* Global scanlines */}
      {settings.scanlines && settings.cameraSceneStyle !== 'hq' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 98,
            background:
              settings.cameraSceneStyle === 'privateHouse'
                ? 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.035) 3px, rgba(0,0,0,0.035) 5px)'
                : 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Header */}
      {settings.showTopPanel && (
        <CCTVHeader
          isFullscreen={isFullscreen}
          onFullscreenToggle={handleFullscreenToggle}
          cameraCount={cameraCount}
          activeCount={activeCount}
          onSettingsToggle={() => setShowSettings((s) => !s)}
          settingsOpen={showSettings}
        />
      )}

      {/* Settings panel — slide in from right, hidden in fullscreen */}
      {showSettings && !isFullscreen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: 360,
            zIndex: 300,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ThemeSettingsPanel onClose={() => setShowSettings(false)} />
        </div>
      )}

      {/* Recovery controls when panels are hidden */}
      {!isFullscreen && hiddenPanelCount > 0 && (
        <div
          className="fixed right-3 top-3 z-[260] flex gap-1.5"
          style={{ fontFamily: 'var(--font-share-tech-mono), monospace' }}
        >
          {!settings.showTopPanel && (
            <button
              className="cctv-btn"
              style={{ fontSize: '8px', padding: '3px 7px', background: palette.bg }}
              onClick={() => update({ showTopPanel: true })}
            >
              TOP
            </button>
          )}
          {!settings.showBottomPanel && (
            <button
              className="cctv-btn"
              style={{ fontSize: '8px', padding: '3px 7px', background: palette.bg }}
              onClick={() => update({ showBottomPanel: true })}
            >
              BOTTOM
            </button>
          )}
          {!settings.showTopPanel && (
            <button
              className="cctv-btn cctv-btn-amber"
              style={{ fontSize: '8px', padding: '3px 7px' }}
              onClick={() => setShowSettings((s) => !s)}
            >
              CFG
            </button>
          )}
        </div>
      )}

      {/* Camera grid — fills all remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <CCTVGrid
          isFullscreen={isFullscreen}
          folderVideos={folderVideos}
          globalGridConfig={gridConfig}
          cameraCount={cameraCount}
        />
      </div>

      {/* Bottom control panel */}
      {settings.showBottomPanel && (
        <ControlPanel
          isFullscreen={isFullscreen}
          gridConfig={gridConfig}
          onGridChange={handleGridChange}
          folderVideos={folderVideos}
          onFolderLoad={setFolderVideos}
          cameraCount={cameraCount}
        />
      )}

      {/* Fullscreen overlay exit hint */}
      {isFullscreen && (
        <div
          className="fixed bottom-3 right-3 z-[200] cctv-btn opacity-60 hover:opacity-100"
          style={{ fontSize: '9px', cursor: 'pointer', transition: 'opacity 0.2s' }}
          onClick={() => setIsFullscreen(false)}
        >
          ESC — EXIT FULLSCREEN
        </div>
      )}
    </div>
  )
}
