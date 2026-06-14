'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import VideoCell, { type CameraConfig } from './VideoCell'
import CameraSettings from './CameraSettings'
import { useTheme } from '@/lib/themeContext'

const LOCATIONS = [
  'MAIN ENTRANCE', 'PARKING LOT A', 'SERVER ROOM', 'CORRIDOR B-4',
  'ROOF ACCESS', 'LOADING DOCK', 'RECEPTION', 'STAIRWELL 2',
  'EXIT GATE', 'PERIMETER E', 'STORAGE ROOM', 'LOBBY',
  'GATE WEST', 'TUNNEL ACCESS', 'CONTROL ROOM', 'ARCHIVE VAULT',
]

const makeDefaultCamera = (id: number): CameraConfig => ({
  id,
  label: `CAM ${String(id).padStart(2, '0')}`,
  location: LOCATIONS[(id - 1) % LOCATIONS.length],
  videoFile: null,
  videoUrl: null,
  aspectRatio: 'auto',
  brightness: 100,
  contrast: 110,
  fisheye: false,
  noiseIntensity: 40,
})

export type GridLayout = '1x1' | '2x2' | '3x3' | '4x4' | '2x3' | '3x2' | '4x3' | 'auto' | 'custom'

export interface GridConfig {
  layout: GridLayout
  cols: number
  rows: number
}

function getAutoGrid(count: number): { cols: number; rows: number } {
  if (count <= 1) return { cols: 1, rows: 1 }
  if (count <= 2) return { cols: 2, rows: 1 }
  if (count <= 4) return { cols: 2, rows: 2 }
  if (count <= 6) return { cols: 3, rows: 2 }
  if (count <= 9) return { cols: 3, rows: 3 }
  if (count <= 12) return { cols: 4, rows: 3 }
  return { cols: 4, rows: 4 }
}

// -----------------------------------------------------------------------
// SortableCell — fills its grid slot 100%, clips video internally
// -----------------------------------------------------------------------
interface SortableCellProps {
  config: CameraConfig
  isFullscreen: boolean
  onConfigChange: (id: number, patch: Partial<CameraConfig>) => void
  showSettings: boolean
  onSettingsToggle: () => void
  onSettingsClose: () => void
}

function SortableCell({
  config,
  isFullscreen,
  onConfigChange,
  showSettings,
  onSettingsToggle,
  onSettingsClose,
}: SortableCellProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: config.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`camera-cell ${isDragging ? 'dragging' : ''}`}
      {...listeners}
      {...attributes}
    >
      <div className="absolute inset-0">
        <VideoCell
          config={config}
          isFullscreen={isFullscreen}
          onConfigChange={onConfigChange}
        />
      </div>

      {/* Settings gear button — only in non-fullscreen, above drag layer */}
      {!isFullscreen && (
        <button
          className="absolute top-1.5 right-1.5 z-30 cctv-btn"
          style={{ padding: '2px 6px', fontSize: '9px' }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onSettingsToggle() }}
        >
          {showSettings ? 'HIDE' : 'CFG'}
        </button>
      )}

      {/* Settings overlay panel */}
      {showSettings && !isFullscreen && (
        <div
          className="absolute inset-0 z-40"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <CameraSettings
            config={config}
            onChange={(patch) => onConfigChange(config.id, patch)}
            onClose={onSettingsClose}
          />
        </div>
      )}
    </div>
  )
}

// -----------------------------------------------------------------------
// CCTVGrid
// -----------------------------------------------------------------------
interface CCTVGridProps {
  isFullscreen: boolean
  folderVideos: File[]
  globalGridConfig: GridConfig
  cameraCount: number
}

export default function CCTVGrid({
  isFullscreen,
  folderVideos,
  globalGridConfig,
  cameraCount,
}: CCTVGridProps) {
  const { settings } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [cameras, setCameras] = useState<CameraConfig[]>(() =>
    Array.from({ length: 64 }, (_, i) => makeDefaultCamera(i + 1))
  )
  const [openSettings, setOpenSettings] = useState<number | null>(null)
  const objectUrlCacheRef = useRef<Map<File, string>>(new Map())

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    return () => {
      objectUrlCacheRef.current.forEach((url) => URL.revokeObjectURL(url))
      objectUrlCacheRef.current.clear()
    }
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const { cols, rows } = globalGridConfig.layout === 'auto'
    ? getAutoGrid(cameraCount)
    : { cols: globalGridConfig.cols, rows: globalGridConfig.rows }

  const totalCells = cols * rows
  const visibleFiles = folderVideos.slice(0, totalCells)

  // Auto-assign only the currently visible folder videos to cameras.
  // Reuse object URLs per File instead of recreating/reloading them on every reorder.
  useEffect(() => {
    const cache = objectUrlCacheRef.current
    const visibleFileSet = new Set(visibleFiles)

    for (const [file, url] of cache) {
      if (!visibleFileSet.has(file)) {
        URL.revokeObjectURL(url)
        cache.delete(file)
      }
    }

    setCameras((prev) => prev.map((cam, i) => {
      const file = i < totalCells ? visibleFiles[i] ?? null : null
      let videoUrl: string | null = null

      if (file) {
        videoUrl = cache.get(file) ?? null
        if (!videoUrl) {
          videoUrl = URL.createObjectURL(file)
          cache.set(file, videoUrl)
        }
      }

      if (cam.videoFile === file && cam.videoUrl === videoUrl) return cam

      return {
        ...cam,
        videoFile: file,
        videoUrl,
      }
    }))
  }, [visibleFiles, totalCells])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setCameras((prev) => {
      const oldIdx = prev.findIndex((c) => c.id === active.id)
      const newIdx = prev.findIndex((c) => c.id === over.id)
      return arrayMove(prev, oldIdx, newIdx)
    })
  }, [])

  const handleConfigChange = useCallback((id: number, patch: Partial<CameraConfig>) => {
    setCameras((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }, [])

  const activeCameras = cameras.slice(0, totalCells)
  const ids = activeCameras.map((c) => c.id)

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
    gap: `${settings.gridGap}px`,
    width: '100%',
    height: '100%',
    background: 'oklch(0.025 0.002 200)',
  }

  if (!mounted) {
    return (
      <div style={gridStyle} className="crt-flicker">
        {activeCameras.map((cam) => (
          <div key={cam.id} style={{ position: 'relative', overflow: 'hidden' }} className="camera-cell">
            <div className="absolute inset-0">
              <VideoCell config={cam} isFullscreen={isFullscreen} onConfigChange={handleConfigChange} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div style={gridStyle} className="crt-flicker">
          {activeCameras.map((cam) => (
            <SortableCell
              key={cam.id}
              config={cam}
              isFullscreen={isFullscreen}
              onConfigChange={handleConfigChange}
              showSettings={openSettings === cam.id}
              onSettingsToggle={() =>
                setOpenSettings((prev) => (prev === cam.id ? null : cam.id))
              }
              onSettingsClose={() => setOpenSettings(null)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
