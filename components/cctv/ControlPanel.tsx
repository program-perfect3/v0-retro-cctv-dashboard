'use client'

import { useRef, useState } from 'react'
import type { GridLayout, GridConfig } from './CCTVGrid'
// GridConfig is re-exported for page-level consumption
export type { GridConfig }

const GRID_PRESETS: { layout: GridLayout; label: string; cols: number; rows: number }[] = [
  { layout: '1x1', cols: 1, rows: 1, label: '1×1' },
  { layout: '2x2', cols: 2, rows: 2, label: '2×2' },
  { layout: '2x3', cols: 2, rows: 3, label: '2×3' },
  { layout: '3x2', cols: 3, rows: 2, label: '3×2' },
  { layout: '3x3', cols: 3, rows: 3, label: '3×3' },
  { layout: '4x3', cols: 4, rows: 3, label: '4×3' },
  { layout: '4x4', cols: 4, rows: 4, label: '4×4' },
  { layout: 'auto', cols: 0, rows: 0, label: 'AUTO' },
]

interface ControlPanelProps {
  isFullscreen: boolean
  gridConfig: GridConfig
  onGridChange: (cfg: GridConfig) => void
  folderVideos: File[]
  onFolderLoad: (files: File[]) => void
  cameraCount: number
}

export default function ControlPanel({
  isFullscreen,
  gridConfig,
  onGridChange,
  folderVideos,
  onFolderLoad,
  cameraCount,
}: ControlPanelProps) {
  const folderInputRef = useRef<HTMLInputElement>(null)
  const [folderPath, setFolderPath] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [allFiles, setAllFiles] = useState<File[]>([])
  const [showFileList, setShowFileList] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  // Custom grid inputs
  const [customCols, setCustomCols] = useState(String(gridConfig.cols || 2))
  const [customRows, setCustomRows] = useState(String(gridConfig.rows || 2))

  if (isFullscreen) return null

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const videoFiles = files
      .filter((f) => f.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv|ogv|m4v|ts)$/i.test(f.name))
      .sort((a, b) => {
        // Natural sort: file_001 < file_002 etc.
        const ap = (f: File) => (f as { webkitRelativePath?: string }).webkitRelativePath || f.name
        return ap(a).localeCompare(ap(b), undefined, { numeric: true, sensitivity: 'base' })
      })

    setAllFiles(videoFiles)
    onFolderLoad(videoFiles)
    setShowFileList(videoFiles.length > 0)

    if (files.length > 0) {
      const rel = (files[0] as { webkitRelativePath?: string }).webkitRelativePath || ''
      const folder = rel.split('/').slice(0, -1).join('/') || 'ROOT'
      setFolderPath(folder)
    }
  }

  const filteredFiles = searchTerm.trim()
    ? allFiles.filter((f) => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : allFiles

  const handleFilePromote = (file: File) => {
    const reordered = [file, ...allFiles.filter((f) => f !== file)]
    setAllFiles(reordered)
    onFolderLoad(reordered)
  }

  const applyCustomGrid = () => {
    const c = Math.max(1, Math.min(8, parseInt(customCols) || 2))
    const r = Math.max(1, Math.min(8, parseInt(customRows) || 2))
    onGridChange({ layout: 'custom', cols: c, rows: r })
    setCustomCols(String(c))
    setCustomRows(String(r))
  }

  const noSignalCount = Math.max(0, cameraCount - folderVideos.length)

  return (
    <div
      className="border-t flex-shrink-0 overflow-hidden"
      style={{
        borderColor: 'oklch(0.2 0.05 145)',
        background: 'oklch(0.065 0.005 200)',
        maxHeight: collapsed ? '36px' : '220px',
        transition: 'max-height 0.25s ease',
      }}
    >
      {/* Panel toggle bar */}
      <div
        className="flex items-center justify-between px-3 cursor-pointer border-b select-none"
        style={{ borderColor: 'oklch(0.16 0.04 145)', height: '36px' }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="flex items-center gap-3">
          <span className="crt-text" style={{ fontSize: '9px', letterSpacing: '0.18em' }}>
            DVR CONTROL PANEL
          </span>
          <span style={{ fontSize: '8px', color: 'oklch(0.35 0.07 145)', letterSpacing: '0.1em' }}>
            v2.1.4
          </span>
        </div>
        <div className="flex items-center gap-4">
          {folderVideos.length > 0 && (
            <span style={{ fontSize: '8px', letterSpacing: '0.08em', color: 'oklch(0.62 0.17 75)' }}>
              [{folderVideos.length} FILES]
            </span>
          )}
          {noSignalCount > 0 && (
            <span style={{ fontSize: '8px', letterSpacing: '0.08em', color: 'oklch(0.65 0.2 25)' }}>
              [{noSignalCount} NO SIG]
            </span>
          )}
          <span className="crt-text" style={{ fontSize: '10px', lineHeight: 1 }}>
            {collapsed ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {!collapsed && (
        <div
          className="flex flex-wrap gap-x-5 gap-y-3 px-4 py-3 overflow-y-auto"
          style={{ maxHeight: '184px' }}
        >
          {/* === GRID LAYOUT === */}
          <div className="flex flex-col gap-1.5 min-w-[200px]">
            <div className="panel-section-title">GRID LAYOUT</div>
            <div className="flex flex-wrap gap-1">
              {GRID_PRESETS.map((preset) => (
                <button
                  key={preset.layout}
                  className={`cctv-btn ${gridConfig.layout === preset.layout ? 'cctv-btn-amber' : ''}`}
                  style={{ padding: '2px 7px', fontSize: '9px' }}
                  onClick={() => {
                    if (preset.layout !== 'auto') {
                      setCustomCols(String(preset.cols))
                      setCustomRows(String(preset.rows))
                    }
                    onGridChange(preset)
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom grid input */}
            <div className="flex items-center gap-1 mt-0.5">
              <span style={{ fontSize: '8px', color: 'oklch(0.42 0.08 145)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                CUSTOM:
              </span>
              <input
                className="cctv-input"
                style={{ width: '36px', padding: '2px 5px', fontSize: '10px', textAlign: 'center' }}
                value={customCols}
                onChange={(e) => setCustomCols(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && applyCustomGrid()}
                placeholder="C"
                maxLength={1}
                title="Columns (1–8)"
              />
              <span style={{ fontSize: '10px', color: 'oklch(0.42 0.08 145)' }}>×</span>
              <input
                className="cctv-input"
                style={{ width: '36px', padding: '2px 5px', fontSize: '10px', textAlign: 'center' }}
                value={customRows}
                onChange={(e) => setCustomRows(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && applyCustomGrid()}
                placeholder="R"
                maxLength={1}
                title="Rows (1–8)"
              />
              <button
                className={`cctv-btn ${gridConfig.layout === 'custom' ? 'cctv-btn-amber' : ''}`}
                style={{ padding: '2px 8px', fontSize: '9px' }}
                onClick={applyCustomGrid}
              >
                SET
              </button>
            </div>
          </div>

          {/* === VIDEO SOURCE === */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-[220px]">
            <div className="panel-section-title">VIDEO SOURCE — FOLDER</div>

            {/* Open folder + path display */}
            <div className="flex gap-2 items-center">
              <input
                ref={folderInputRef}
                type="file"
                // @ts-expect-error webkitdirectory is non-standard
                webkitdirectory=""
                multiple
                accept="video/*,.mp4,.webm,.mov,.avi,.mkv,.ogv,.m4v,.ts"
                className="hidden"
                onChange={handleFolderSelect}
              />
              <button
                className="cctv-btn cctv-btn-amber"
                style={{ fontSize: '9px', whiteSpace: 'nowrap', flexShrink: 0 }}
                onClick={() => folderInputRef.current?.click()}
              >
                OPEN FOLDER
              </button>
              {folderPath ? (
                <span
                  className="cctv-input truncate"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', fontSize: '9px', padding: '2px 6px', cursor: 'default', color: 'oklch(0.6 0.14 75)' }}
                  title={folderPath}
                >
                  {folderPath}
                </span>
              ) : (
                <span style={{ flex: 1, fontSize: '8px', color: 'oklch(0.32 0.06 145)', letterSpacing: '0.08em' }}>
                  NO FOLDER SELECTED — CLICK TO BROWSE
                </span>
              )}
            </div>

            {/* Search */}
            {allFiles.length > 0 && (
              <div className="flex gap-2 items-center">
                <input
                  className="cctv-input flex-1"
                  placeholder="SEARCH FILES..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ fontSize: '9px', padding: '3px 7px' }}
                />
                <button
                  className="cctv-btn"
                  style={{ padding: '2px 7px', fontSize: '8px', whiteSpace: 'nowrap', flexShrink: 0 }}
                  onClick={() => setShowFileList((s) => !s)}
                >
                  {showFileList ? 'HIDE' : 'LIST'}
                </button>
              </div>
            )}

            {/* File list */}
            {showFileList && filteredFiles.length > 0 && (
              <div
                className="overflow-y-auto"
                style={{
                  maxHeight: '72px',
                  border: '1px solid oklch(0.18 0.04 145)',
                  background: 'oklch(0.05 0.003 200)',
                }}
              >
                {filteredFiles.map((file, idx) => {
                  const globalIdx = allFiles.indexOf(file)
                  const isActive = globalIdx < cameraCount
                  return (
                    <div
                      key={idx}
                      onClick={() => handleFilePromote(file)}
                      className="flex items-center gap-2 px-2 py-0.5 cursor-pointer"
                      style={{
                        fontSize: '8px',
                        letterSpacing: '0.04em',
                        color: globalIdx === 0
                          ? 'oklch(0.82 0.2 75)'
                          : isActive
                          ? 'oklch(0.55 0.12 145)'
                          : 'oklch(0.32 0.06 145)',
                        borderBottom: '1px solid oklch(0.12 0.02 145)',
                        background: globalIdx === 0 ? 'oklch(0.08 0.004 75 / 0.3)' : undefined,
                      }}
                    >
                      <span style={{ color: 'oklch(0.38 0.07 145)', minWidth: '28px' }}>
                        {String(globalIdx + 1).padStart(3, '0')}
                      </span>
                      <span className="truncate flex-1" title={file.name}>{file.name}</span>
                      {isActive && (
                        <span style={{ color: 'oklch(0.55 0.15 145)', flexShrink: 0 }}>
                          CAM{String(globalIdx + 1).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* === STATUS === */}
          <div className="flex flex-col gap-1 min-w-[90px]">
            <div className="panel-section-title">SYS STATUS</div>
            <div
              className="flex flex-col gap-0.5"
              style={{ fontSize: '8px', letterSpacing: '0.07em', color: 'oklch(0.42 0.09 145)', lineHeight: 1.6 }}
            >
              <span>GRID: {gridConfig.layout === 'auto' ? 'AUTO' : `${gridConfig.cols}×${gridConfig.rows}`}</span>
              <span>CAMS: <span className="crt-text">{cameraCount}</span></span>
              <span>FILES: <span style={{ color: 'oklch(0.62 0.17 75)' }}>{folderVideos.length}</span></span>
              <span style={{ color: noSignalCount > 0 ? 'oklch(0.65 0.2 25)' : 'oklch(0.62 0.17 145)' }}>
                {noSignalCount > 0 ? `${noSignalCount}× NO SIGNAL` : 'ALL ASSIGNED'}
              </span>
              <span style={{ marginTop: 4, color: 'oklch(0.35 0.07 145)' }}>
                REC: ACTIVE
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
