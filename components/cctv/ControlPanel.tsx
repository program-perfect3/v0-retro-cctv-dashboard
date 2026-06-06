'use client'

import { useRef, useState } from 'react'
import type { GridLayout } from './CCTVGrid'

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

export interface GridConfig {
  layout: GridLayout
  cols: number
  rows: number
}

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
  const [filteredFiles, setFilteredFiles] = useState<File[]>([])
  const [allFiles, setAllFiles] = useState<File[]>([])
  const [showFileList, setShowFileList] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  if (isFullscreen) return null

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const videoFiles = files
      .filter((f) => f.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv|ogv|m4v)$/i.test(f.name))
      .sort((a, b) => a.name.localeCompare(b.name))

    setAllFiles(videoFiles)
    setFilteredFiles(videoFiles)
    onFolderLoad(videoFiles)

    // Extract folder path from first file
    if (files.length > 0) {
      const pathParts = (files[0] as { webkitRelativePath?: string }).webkitRelativePath || files[0].name
      const folder = pathParts.split('/').slice(0, -1).join('/')
      setFolderPath(folder || 'ROOT')
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (!term.trim()) {
      setFilteredFiles(allFiles)
      return
    }
    setFilteredFiles(allFiles.filter((f) => f.name.toLowerCase().includes(term.toLowerCase())))
  }

  const handleFileClick = (file: File) => {
    // Move clicked file to front
    const reordered = [file, ...allFiles.filter((f) => f !== file)]
    onFolderLoad(reordered)
  }

  return (
    <div
      className="border-t overflow-y-auto"
      style={{
        borderColor: 'oklch(0.22 0.05 145)',
        background: 'oklch(0.07 0.005 200)',
        maxHeight: collapsed ? '38px' : '200px',
        transition: 'max-height 0.3s',
        flexShrink: 0,
      }}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer border-b"
        style={{ borderColor: 'oklch(0.18 0.04 145)' }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <span className="crt-text" style={{ fontSize: '10px', letterSpacing: '0.15em' }}>
          CONTROL PANEL — DVR CONFIG
        </span>
        <div className="flex items-center gap-3">
          {folderVideos.length > 0 && (
            <span style={{ fontSize: '9px', letterSpacing: '0.08em', color: 'oklch(0.65 0.18 75)' }}>
              {folderVideos.length} FILE{folderVideos.length !== 1 ? 'S' : ''} LOADED
            </span>
          )}
          <span className="crt-text" style={{ fontSize: '10px' }}>
            {collapsed ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {!collapsed && (
        <div className="flex flex-wrap gap-4 px-3 py-2">
          {/* Grid layout selector */}
          <div className="flex flex-col gap-1 min-w-[160px]">
            <div className="panel-section-title">GRID LAYOUT</div>
            <div className="flex flex-wrap gap-1">
              {GRID_PRESETS.map((preset) => (
                <button
                  key={preset.layout}
                  className={`cctv-btn ${gridConfig.layout === preset.layout ? 'cctv-btn-amber' : ''}`}
                  style={{ padding: '2px 7px', fontSize: '9px' }}
                  onClick={() => onGridChange(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Folder loader */}
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <div className="panel-section-title">VIDEO SOURCE — FOLDER</div>
            <div className="flex gap-2">
              <input
                ref={folderInputRef}
                type="file"
                // @ts-expect-error webkitdirectory is non-standard
                webkitdirectory=""
                multiple
                accept="video/*,.mp4,.webm,.mov,.avi,.mkv,.ogv,.m4v"
                className="hidden"
                onChange={handleFolderSelect}
              />
              <button
                className="cctv-btn cctv-btn-amber flex-1"
                style={{ fontSize: '10px' }}
                onClick={() => folderInputRef.current?.click()}
              >
                OPEN FOLDER
              </button>
              {folderPath && (
                <span
                  className="cctv-input flex-1 truncate text-ellipsis"
                  style={{ display: 'flex', alignItems: 'center', fontSize: '9px', padding: '2px 6px', cursor: 'default' }}
                  title={folderPath}
                >
                  {folderPath}
                </span>
              )}
            </div>
          </div>

          {/* File search */}
          {allFiles.length > 0 && (
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <div className="panel-section-title flex justify-between">
                <span>SEARCH FILES</span>
                <button
                  className="cctv-btn"
                  style={{ padding: '0 6px', fontSize: '8px' }}
                  onClick={() => setShowFileList((s) => !s)}
                >
                  {showFileList ? 'HIDE LIST' : 'SHOW LIST'}
                </button>
              </div>
              <input
                className="cctv-input"
                placeholder="SEARCH FILENAME..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ fontSize: '10px' }}
              />

              {showFileList && filteredFiles.length > 0 && (
                <div
                  className="mt-1 overflow-y-auto"
                  style={{
                    maxHeight: '80px',
                    border: '1px solid oklch(0.2 0.04 145)',
                    background: 'oklch(0.06 0.004 200)',
                  }}
                >
                  {filteredFiles.map((file, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleFileClick(file)}
                      className="px-2 py-0.5 cursor-pointer hover:bg-[oklch(0.12_0.008_145/0.5)] truncate"
                      style={{
                        fontSize: '9px',
                        letterSpacing: '0.05em',
                        color: idx === 0 ? 'oklch(0.78 0.18 75)' : 'oklch(0.5 0.1 145)',
                        borderBottom: '1px solid oklch(0.14 0.03 145)',
                      }}
                    >
                      [{String(idx + 1).padStart(3, '0')}] {file.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Status info */}
          <div className="flex flex-col gap-1 min-w-[100px]">
            <div className="panel-section-title">STATUS</div>
            <div style={{ fontSize: '9px', letterSpacing: '0.06em', color: 'oklch(0.45 0.1 145)' }}>
              <div>GRID: {gridConfig.layout === 'auto' ? 'AUTO' : `${gridConfig.cols}×${gridConfig.rows}`}</div>
              <div>CAMS: {cameraCount}</div>
              <div>FILES: {folderVideos.length}</div>
              <div style={{ color: folderVideos.length >= cameraCount ? 'oklch(0.68 0.18 145)' : 'oklch(0.65 0.18 75)' }}>
                {folderVideos.length >= cameraCount ? 'ALL ASSIGNED' : `${Math.max(0, cameraCount - folderVideos.length)} NO SIGNAL`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
