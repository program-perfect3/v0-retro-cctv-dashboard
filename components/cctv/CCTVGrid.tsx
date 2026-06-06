'use client'

import { useState, useCallback, useEffect } from 'react'
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
import VideoCell, { type CameraConfig, type AspectRatioOption } from './VideoCell'
import CameraSettings from './CameraSettings'

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

export type GridLayout = '1x1' | '2x2' | '3x3' | '4x4' | '2x3' | '3x2' | '4x3' | 'auto'

interface GridConfig {
  layout: GridLayout
  cols: number
  rows: number
}

const GRID_PRESETS: { layout: GridLayout; cols: number; rows: number; label: string }[] = [
  { layout: '1x1', cols: 1, rows: 1, label: '1x1' },
  { layout: '2x2', cols: 2, rows: 2, label: '2x2' },
  { layout: '2x3', cols: 2, rows: 3, label: '2x3' },
  { layout: '3x2', cols: 3, rows: 2, label: '3x2' },
  { layout: '3x3', cols: 3, rows: 3, label: '3x3' },
  { layout: '4x3', cols: 4, rows: 3, label: '4x3' },
  { layout: '4x4', cols: 4, rows: 4, label: '4x4' },
  { layout: 'auto', cols: 0, rows: 0, label: 'AUTO' },
]

function getAutoGrid(count: number): { cols: number; rows: number } {
  if (count <= 1) return { cols: 1, rows: 1 }
  if (count <= 2) return { cols: 2, rows: 1 }
  if (count <= 4) return { cols: 2, rows: 2 }
  if (count <= 6) return { cols: 3, rows: 2 }
  if (count <= 9) return { cols: 3, rows: 3 }
  if (count <= 12) return { cols: 4, rows: 3 }
  return { cols: 4, rows: 4 }
}

interface SortableCellProps {
  config: CameraConfig
  isFullscreen: boolean
  onConfigChange: (id: number, patch: Partial<CameraConfig>) => void
  showSettings: boolean
  onSettingsToggle: () => void
  onSettingsClose: () => void
  gridCols: number
  aspectRatioOverride: string | null
}

function SortableCell({
  config,
  isFullscreen,
  onConfigChange,
  showSettings,
  onSettingsToggle,
  onSettingsClose,
  gridCols,
  aspectRatioOverride,
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
  }

  // Compute aspect ratio padding for the cell
  let paddingBottom = '56.25%' // 16/9 default
  const ar = config.aspectRatio
  if (ar === '4/3') paddingBottom = '75%'
  else if (ar === '1/1') paddingBottom = '100%'
  else if (ar === '3/2') paddingBottom = '66.67%'
  else if (ar === '16/9') paddingBottom = '56.25%'
  else paddingBottom = '56.25%' // auto

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`camera-cell ${isDragging ? 'dragging' : ''}`}
    >
      {/* Inner wrapper with aspect ratio */}
      <div
        className="relative w-full"
        style={{
          paddingBottom: config.aspectRatio === 'auto' ? undefined : paddingBottom,
          height: config.aspectRatio === 'auto' ? '100%' : undefined,
        }}
      >
        <div
          className="absolute inset-0"
          {...listeners}
          {...attributes}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <VideoCell
            config={config}
            isFullscreen={isFullscreen}
            onConfigChange={onConfigChange}
          />
        </div>

        {/* Settings gear button — only in non-fullscreen */}
        {!isFullscreen && (
          <button
            className="absolute top-1.5 right-1.5 z-30 cctv-btn"
            style={{ padding: '2px 6px', fontSize: '9px', pointerEvents: 'all' }}
            onClick={(e) => { e.stopPropagation(); onSettingsToggle() }}
          >
            {showSettings ? 'HIDE' : 'CFG'}
          </button>
        )}

        {/* Settings panel */}
        {showSettings && !isFullscreen && (
          <CameraSettings
            config={config}
            onChange={(patch) => onConfigChange(config.id, patch)}
            onClose={onSettingsClose}
          />
        )}
      </div>
    </div>
  )
}

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
  const [mounted, setMounted] = useState(false)
  const [cameras, setCameras] = useState<CameraConfig[]>(() =>
    Array.from({ length: 16 }, (_, i) => makeDefaultCamera(i + 1))
  )
  const [openSettings, setOpenSettings] = useState<number | null>(null)

  useEffect(() => { setMounted(true) }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Auto-assign folder videos to cameras
  useEffect(() => {
    if (folderVideos.length === 0) return
    setCameras((prev) => {
      const updated = [...prev]
      for (let i = 0; i < updated.length && i < folderVideos.length; i++) {
        const file = folderVideos[i]
        if (updated[i].videoUrl) URL.revokeObjectURL(updated[i].videoUrl!)
        updated[i] = {
          ...updated[i],
          videoFile: file,
          videoUrl: URL.createObjectURL(file),
        }
      }
      return updated
    })
  }, [folderVideos])

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

  // Determine actual grid dimensions
  const { cols, rows } = globalGridConfig.layout === 'auto'
    ? getAutoGrid(cameraCount)
    : { cols: globalGridConfig.cols, rows: globalGridConfig.rows }

  const totalCells = cols * rows
  const activeCameras = cameras.slice(0, totalCells)
  const ids = activeCameras.map((c) => c.id)

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
    gap: '2px',
    width: '100%',
    height: '100%',
    background: 'oklch(0.04 0.003 200)',
  }

  // Static grid for SSR — no DnD IDs so no hydration mismatch
  if (!mounted) {
    return (
      <div style={gridStyle} className="crt-flicker">
        {activeCameras.map((cam) => (
          <div key={cam.id} className="camera-cell relative">
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
              gridCols={cols}
              aspectRatioOverride={null}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
