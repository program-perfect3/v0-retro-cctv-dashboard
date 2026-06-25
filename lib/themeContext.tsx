'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
export type ThemeColor = 'green' | 'amber' | 'red' | 'blue' | 'white'
export type Locale = 'en' | 'ru'
export type CameraSceneStyle = 'guard' | 'hq' | 'police' | 'privateHouse'

export type CustomColorKey =
  | 'primary'
  | 'primaryDim'
  | 'primaryFaint'
  | 'background'
  | 'panelBackground'
  | 'cardBackground'
  | 'border'
  | 'borderDim'
  | 'danger'
  | 'gridBackground'
  | 'cameraBackground'
  | 'overlayBackground'

export type CustomColors = Record<CustomColorKey, string>

export interface ThemeSettings {
  color: ThemeColor
  textScale: number        // 70 – 170 (%)
  uiScale: number          // 75 – 150 (%)
  scanlines: boolean
  noise: boolean
  glow: boolean
  flicker: boolean
  vignette: boolean
  locale: Locale
  gridGap: number          // 0 – 12 px
  timestampVisible: boolean
  clockBaseTimeMs: number | null
  clockBaseRealMs: number | null
  cameraSceneStyle: CameraSceneStyle
  customSystemTitle: string
  customSystemSub: string
  customPanelTitle: string
  customPanelVer: string
  showTopPanel: boolean
  showBottomPanel: boolean
  showTicker: boolean
  showStatusPills: boolean
  customColors: CustomColors
}

export interface ThemePalette {
  hue: number
  label: string
  labelRu: string
  primary: string
  primaryDim: string
  primaryFaint: string
  bg: string
  panelBg: string
  bgCard: string
  border: string
  borderDim: string
  textGlow: string
  amberHue: number
  danger: string
  gridBg: string
  cameraBg: string
  overlayBg: string
}

export const CCTV_THEME_STORAGE_KEY = 'cctv.theme.settings.v2'
export const CCTV_RESET_EVENT = 'cctv:reset-all'

export const DEFAULT_CUSTOM_COLORS: CustomColors = {
  primary: '',
  primaryDim: '',
  primaryFaint: '',
  background: '',
  panelBackground: '',
  cardBackground: '',
  border: '',
  borderDim: '',
  danger: '',
  gridBackground: '',
  cameraBackground: '',
  overlayBackground: '',
}

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  color: 'green',
  textScale: 100,
  uiScale: 100,
  scanlines: true,
  noise: true,
  glow: true,
  flicker: true,
  vignette: true,
  locale: 'ru',
  gridGap: 2,
  timestampVisible: true,
  clockBaseTimeMs: null,
  clockBaseRealMs: null,
  cameraSceneStyle: 'guard',
  customSystemTitle: '',
  customSystemSub: '',
  customPanelTitle: '',
  customPanelVer: '',
  showTopPanel: true,
  showBottomPanel: true,
  showTicker: true,
  showStatusPills: true,
  customColors: DEFAULT_CUSTOM_COLORS,
}

const COLORS: ThemeColor[] = ['green', 'amber', 'red', 'blue', 'white']
const LOCALES: Locale[] = ['en', 'ru']
const SCENES: CameraSceneStyle[] = ['guard', 'hq', 'police', 'privateHouse']

const clamp = (value: unknown, min: number, max: number, fallback: number) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, n))
}

const stringOr = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback)
const boolOr = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback)

function sanitizeCustomColors(value: unknown): CustomColors {
  const raw = value && typeof value === 'object' ? value as Partial<Record<CustomColorKey, unknown>> : {}
  return {
    primary: stringOr(raw.primary),
    primaryDim: stringOr(raw.primaryDim),
    primaryFaint: stringOr(raw.primaryFaint),
    background: stringOr(raw.background),
    panelBackground: stringOr(raw.panelBackground),
    cardBackground: stringOr(raw.cardBackground),
    border: stringOr(raw.border),
    borderDim: stringOr(raw.borderDim),
    danger: stringOr(raw.danger),
    gridBackground: stringOr(raw.gridBackground),
    cameraBackground: stringOr(raw.cameraBackground),
    overlayBackground: stringOr(raw.overlayBackground),
  }
}

function sanitizeSettings(value: unknown): ThemeSettings {
  const raw = value && typeof value === 'object' ? value as Partial<ThemeSettings> : {}

  return {
    ...DEFAULT_THEME_SETTINGS,
    color: COLORS.includes(raw.color as ThemeColor) ? raw.color as ThemeColor : DEFAULT_THEME_SETTINGS.color,
    textScale: clamp(raw.textScale, 70, 170, DEFAULT_THEME_SETTINGS.textScale),
    uiScale: clamp(raw.uiScale, 75, 150, DEFAULT_THEME_SETTINGS.uiScale),
    scanlines: boolOr(raw.scanlines, DEFAULT_THEME_SETTINGS.scanlines),
    noise: boolOr(raw.noise, DEFAULT_THEME_SETTINGS.noise),
    glow: boolOr(raw.glow, DEFAULT_THEME_SETTINGS.glow),
    flicker: boolOr(raw.flicker, DEFAULT_THEME_SETTINGS.flicker),
    vignette: boolOr(raw.vignette, DEFAULT_THEME_SETTINGS.vignette),
    locale: LOCALES.includes(raw.locale as Locale) ? raw.locale as Locale : DEFAULT_THEME_SETTINGS.locale,
    gridGap: clamp(raw.gridGap, 0, 12, DEFAULT_THEME_SETTINGS.gridGap),
    timestampVisible: boolOr(raw.timestampVisible, DEFAULT_THEME_SETTINGS.timestampVisible),
    clockBaseTimeMs: typeof raw.clockBaseTimeMs === 'number' ? raw.clockBaseTimeMs : null,
    clockBaseRealMs: typeof raw.clockBaseRealMs === 'number' ? raw.clockBaseRealMs : null,
    cameraSceneStyle: SCENES.includes(raw.cameraSceneStyle as CameraSceneStyle) ? raw.cameraSceneStyle as CameraSceneStyle : DEFAULT_THEME_SETTINGS.cameraSceneStyle,
    customSystemTitle: stringOr(raw.customSystemTitle),
    customSystemSub: stringOr(raw.customSystemSub),
    customPanelTitle: stringOr(raw.customPanelTitle),
    customPanelVer: stringOr(raw.customPanelVer),
    showTopPanel: boolOr(raw.showTopPanel, DEFAULT_THEME_SETTINGS.showTopPanel),
    showBottomPanel: boolOr(raw.showBottomPanel, DEFAULT_THEME_SETTINGS.showBottomPanel),
    showTicker: boolOr(raw.showTicker, DEFAULT_THEME_SETTINGS.showTicker),
    showStatusPills: boolOr(raw.showStatusPills, DEFAULT_THEME_SETTINGS.showStatusPills),
    customColors: sanitizeCustomColors(raw.customColors),
  }
}

function readStoredSettings(): ThemeSettings {
  if (typeof window === 'undefined') return DEFAULT_THEME_SETTINGS

  try {
    const raw = window.localStorage.getItem(CCTV_THEME_STORAGE_KEY)
    if (!raw) return DEFAULT_THEME_SETTINGS
    return sanitizeSettings(JSON.parse(raw))
  } catch {
    return DEFAULT_THEME_SETTINGS
  }
}

export function getCctvNow(settings: ThemeSettings) {
  if (settings.clockBaseTimeMs !== null && settings.clockBaseRealMs !== null) {
    return new Date(settings.clockBaseTimeMs + (Date.now() - settings.clockBaseRealMs))
  }
  return new Date()
}

// ----------------------------------------------------------------
// Colour palettes for each theme
// ----------------------------------------------------------------
export const THEME_PALETTES: Record<ThemeColor, ThemePalette> = {
  green: {
    hue: 145,
    label: 'PHOSPHOR GREEN',
    labelRu: 'ЗЕЛЕНЫЙ ФОСФОР',
    primary:      'oklch(0.72 0.22 145)',
    primaryDim:   'oklch(0.48 0.10 145)',
    primaryFaint: 'oklch(0.25 0.05 145)',
    bg:           'oklch(0.045 0.004 200)',
    panelBg:      'oklch(0.045 0.004 200)',
    bgCard:       'oklch(0.07 0.005 200)',
    border:       'oklch(0.28 0.07 145)',
    borderDim:    'oklch(0.18 0.04 145)',
    textGlow:     '0 0 6px oklch(0.72 0.22 145 / 0.7), 0 0 14px oklch(0.55 0.22 145 / 0.35)',
    amberHue:     75,
    danger:       'oklch(0.7 0.22 25)',
    gridBg:       'oklch(0.025 0.002 200)',
    cameraBg:     '',
    overlayBg:    '',
  },
  amber: {
    hue: 75,
    label: 'AMBER CRT',
    labelRu: 'ЯНТАРНЫЙ ЭЛТ',
    primary:      'oklch(0.78 0.2 75)',
    primaryDim:   'oklch(0.5 0.1 75)',
    primaryFaint: 'oklch(0.28 0.05 75)',
    bg:           'oklch(0.045 0.004 60)',
    panelBg:      'oklch(0.045 0.004 60)',
    bgCard:       'oklch(0.07 0.005 60)',
    border:       'oklch(0.3 0.08 75)',
    borderDim:    'oklch(0.2 0.05 75)',
    textGlow:     '0 0 6px oklch(0.78 0.2 75 / 0.7), 0 0 14px oklch(0.6 0.2 75 / 0.35)',
    amberHue:     75,
    danger:       'oklch(0.7 0.22 25)',
    gridBg:       'oklch(0.025 0.002 60)',
    cameraBg:     '',
    overlayBg:    '',
  },
  red: {
    hue: 25,
    label: 'RED ALERT',
    labelRu: 'КРАСНАЯ ТРЕВОГА',
    primary:      'oklch(0.68 0.22 25)',
    primaryDim:   'oklch(0.45 0.12 25)',
    primaryFaint: 'oklch(0.25 0.06 25)',
    bg:           'oklch(0.045 0.005 20)',
    panelBg:      'oklch(0.045 0.005 20)',
    bgCard:       'oklch(0.07 0.006 20)',
    border:       'oklch(0.28 0.09 25)',
    borderDim:    'oklch(0.18 0.05 25)',
    textGlow:     '0 0 6px oklch(0.68 0.22 25 / 0.7), 0 0 14px oklch(0.5 0.22 25 / 0.35)',
    amberHue:     40,
    danger:       'oklch(0.72 0.24 25)',
    gridBg:       'oklch(0.025 0.002 20)',
    cameraBg:     '',
    overlayBg:    '',
  },
  blue: {
    hue: 240,
    label: 'NIGHT VISION',
    labelRu: 'НОЧНОЕ ВИДЕНИЕ',
    primary:      'oklch(0.68 0.18 240)',
    primaryDim:   'oklch(0.45 0.1 240)',
    primaryFaint: 'oklch(0.25 0.05 240)',
    bg:           'oklch(0.045 0.005 240)',
    panelBg:      'oklch(0.045 0.005 240)',
    bgCard:       'oklch(0.07 0.006 240)',
    border:       'oklch(0.28 0.07 240)',
    borderDim:    'oklch(0.18 0.04 240)',
    textGlow:     '0 0 6px oklch(0.68 0.18 240 / 0.7), 0 0 14px oklch(0.5 0.18 240 / 0.35)',
    amberHue:     210,
    danger:       'oklch(0.7 0.22 25)',
    gridBg:       'oklch(0.025 0.002 240)',
    cameraBg:     '',
    overlayBg:    '',
  },
  white: {
    hue: 200,
    label: 'MONOCHROME',
    labelRu: 'МОНОХРОМ',
    primary:      'oklch(0.82 0.02 200)',
    primaryDim:   'oklch(0.55 0.015 200)',
    primaryFaint: 'oklch(0.28 0.01 200)',
    bg:           'oklch(0.04 0.002 200)',
    panelBg:      'oklch(0.04 0.002 200)',
    bgCard:       'oklch(0.08 0.003 200)',
    border:       'oklch(0.32 0.02 200)',
    borderDim:    'oklch(0.2 0.01 200)',
    textGlow:     '0 0 4px oklch(0.82 0.02 200 / 0.5)',
    amberHue:     200,
    danger:       'oklch(0.7 0.22 25)',
    gridBg:       'oklch(0.025 0.002 200)',
    cameraBg:     '',
    overlayBg:    '',
  },
}

export function resolvePalette(settings: ThemeSettings): ThemePalette {
  const base = THEME_PALETTES[settings.color]
  const c = settings.customColors
  const primary = c.primary || base.primary
  const primaryDim = c.primaryDim || base.primaryDim
  const primaryFaint = c.primaryFaint || base.primaryFaint

  return {
    ...base,
    primary,
    primaryDim,
    primaryFaint,
    bg: c.background || base.bg,
    panelBg: c.panelBackground || c.background || base.panelBg,
    bgCard: c.cardBackground || base.bgCard,
    border: c.border || base.border,
    borderDim: c.borderDim || base.borderDim,
    danger: c.danger || base.danger,
    gridBg: c.gridBackground || base.gridBg,
    cameraBg: c.cameraBackground || base.cameraBg,
    overlayBg: c.overlayBackground || base.overlayBg,
    textGlow: c.primary
      ? `0 0 6px ${primary}, 0 0 14px ${primaryDim}`
      : base.textGlow,
  }
}

// ----------------------------------------------------------------
// Translations
// ----------------------------------------------------------------
export const TRANSLATIONS = {
  en: {
    systemTitle: 'SECUREVISION',
    systemSub: 'DVR SYSTEM v2.1',
    panelTitle: 'DVR CONTROL PANEL',
    panelVer: 'v2.1.4',
    gridLayout: 'GRID LAYOUT',
    videoSource: 'VIDEO SOURCE — FOLDER',
    sysStatus: 'SYS STATUS',
    openFolder: 'OPEN FOLDER',
    noFolder: 'NO FOLDER SELECTED — CLICK TO BROWSE',
    searchFiles: 'SEARCH FILES...',
    hide: 'HIDE',
    list: 'LIST',
    custom: 'CUSTOM:',
    set: 'SET',
    noSignal: 'NO SIGNAL',
    searching: 'SEARCHING...',
    grid: 'GRID:',
    cams: 'CAMS:',
    files: 'FILES:',
    noSig: 'NO SIGNAL',
    allAssigned: 'ALL ASSIGNED',
    recActive: 'REC: ACTIVE',
    fullscreen: 'FULLSCREEN',
    exitFull: 'EXIT FULL',
    exitHint: 'ESC — EXIT FULLSCREEN',
    settings: 'SETTINGS',
    cfg: 'CFG',
    drag: 'DRAG',
    security: 'SECURITY ALERT LEVEL: NORMAL',
    tickerFull: '>>> SECURITY ALERT LEVEL: NORMAL   ///   ALL SECTORS MONITORED   ///   MOTION DETECTION: ACTIVE   ///   PERIMETER STATUS: SECURE   ///   STORAGE: 2.4TB FREE   ///   LAST EVENT: NO ANOMALIES   ///   SYSTEM UPTIME: 72H 14M   <<<',
    online: 'ONLINE',
    rec: 'REC',
    settingsTitle: 'PERSONALIZATION',
    colorTheme: 'COLOR THEME',
    clockTitle: 'CLOCK / TIMECODE',
    clockDate: 'DATE',
    clockTime: 'TIME',
    clockNow: 'NOW',
    clockReset: 'REAL',
    textSize: 'TEXT SIZE',
    effects: 'EFFECTS',
    scanlines: 'SCANLINES',
    noise: 'NOISE',
    glow: 'GLOW',
    flicker: 'FLICKER',
    vignette: 'VIGNETTE',
    localeLabel: 'LANGUAGE',
    gridGap: 'GRID GAP',
    timestamps: 'TIMESTAMPS',
    close: 'CLOSE',
    px: 'PX',
    locations: [
      'MAIN ENTRANCE', 'PARKING LOT A', 'SERVER ROOM', 'CORRIDOR B-4',
      'ROOF ACCESS', 'LOADING DOCK', 'RECEPTION', 'STAIRWELL 2',
      'EXIT GATE', 'PERIMETER E', 'STORAGE ROOM', 'LOBBY',
      'GATE WEST', 'TUNNEL ACCESS', 'CONTROL ROOM', 'ARCHIVE VAULT',
    ],
  },
  ru: {
    systemTitle: 'СЕКЬЮВИЖН',
    systemSub: 'СИСТЕМА DVR v2.1',
    panelTitle: 'ПАНЕЛЬ УПРАВЛЕНИЯ DVR',
    panelVer: 'v2.1.4',
    gridLayout: 'СЕТКА КАМЕР',
    videoSource: 'ИСТОЧНИК — ПАПКА С ВИДЕО',
    sysStatus: 'СТАТУС СИСТЕМЫ',
    openFolder: 'ОТКРЫТЬ ПАПКУ',
    noFolder: 'ПАПКА НЕ ВЫБРАНА — НАЖМИТЕ ДЛЯ ОБЗОРА',
    searchFiles: 'ПОИСК ФАЙЛОВ...',
    hide: 'СКРЫТЬ',
    list: 'СПИСОК',
    custom: 'СВОЕ:',
    set: 'ОК',
    noSignal: 'НЕТ СИГНАЛА',
    searching: 'ПОИСК...',
    grid: 'СЕТКА:',
    cams: 'КАМ:',
    files: 'ФАЙЛЫ:',
    noSig: 'НЕТ СИГНАЛА',
    allAssigned: 'ВСЕ НАЗНАЧЕНЫ',
    recActive: 'ЗАПИСЬ: АКТИВНА',
    fullscreen: 'НА ВЕСЬ ЭКРАН',
    exitFull: 'СВЕРНУТЬ',
    exitHint: 'ESC — ВЫЙТИ ИЗ ПОЛНОГО ЭКРАНА',
    settings: 'НАСТРОЙКИ',
    cfg: 'КНФ',
    drag: 'ТЯНУТЬ',
    security: 'УРОВЕНЬ УГРОЗЫ: НОРМА',
    tickerFull: '>>> УРОВЕНЬ УГРОЗЫ: НОРМА   ///   ВСЕ СЕКТОРЫ ПОД КОНТРОЛЕМ   ///   ДЕТЕКЦИЯ ДВИЖЕНИЯ: АКТИВНА   ///   ПЕРИМЕТР: ЗАЩИЩЕН   ///   СВОБОДНО: 2.4ТБ   ///   ПОСЛЕДНЕЕ СОБЫТИЕ: АНОМАЛИЙ НЕТ   ///   АПТАЙМ: 72Ч 14М   <<<',
    online: 'В СЕТИ',
    rec: 'ЗАП',
    settingsTitle: 'ПЕРСОНАЛИЗАЦИЯ',
    colorTheme: 'ЦВЕТОВАЯ ТЕМА',
    clockTitle: 'ДАТА / ВРЕМЯ ОТСЧЕТА',
    clockDate: 'ДАТА',
    clockTime: 'ВРЕМЯ',
    clockNow: 'СЕЙЧАС',
    clockReset: 'РЕАЛЬНОЕ',
    textSize: 'РАЗМЕР ТЕКСТА',
    effects: 'ЭФФЕКТЫ',
    scanlines: 'СТРОЧНАЯ РАЗВЕРТКА',
    noise: 'ШУМ',
    glow: 'СВЕЧЕНИЕ',
    flicker: 'МЕРЦАНИЕ',
    vignette: 'ВИНЬЕТКА',
    localeLabel: 'ЯЗЫК',
    gridGap: 'ЗАЗОР СЕТКИ',
    timestamps: 'ОТМЕТКИ ВРЕМЕНИ',
    close: 'ЗАКРЫТЬ',
    px: 'ПКС',
    locations: [
      'ГЛАВНЫЙ ВХОД', 'ПАРКОВКА А', 'СЕРВЕРНАЯ', 'КОРИДОР Б-4',
      'ВЫХОД НА КРЫШУ', 'ПОГРУЗОЧНЫЙ ДОК', 'РЕСЕПШН', 'ЛЕСТНИЦА 2',
      'ВЫХОДНЫЕ ВОРОТА', 'ПЕРИМЕТР E', 'СКЛАД', 'ЛОББИ',
      'ЗАПАДНЫЕ ВОРОТА', 'ТОННЕЛЬНЫЙ ВХОД', 'ПОСТ УПРАВЛЕНИЯ', 'АРХИВ',
    ],
  },
} as const

export type TranslationKey = keyof typeof TRANSLATIONS['en']

// ----------------------------------------------------------------
// Context
// ----------------------------------------------------------------
type AnyTranslation = typeof TRANSLATIONS[keyof typeof TRANSLATIONS]

interface ThemeContextValue {
  settings: ThemeSettings
  update: (patch: Partial<ThemeSettings>) => void
  resetSettings: () => void
  t: AnyTranslation
  palette: ThemePalette
}

const ThemeContext = createContext<ThemeContextValue>({
  settings: DEFAULT_THEME_SETTINGS,
  update: () => {},
  resetSettings: () => {},
  t: TRANSLATIONS.en as AnyTranslation,
  palette: THEME_PALETTES.green,
})

export function useTheme() {
  return useContext(ThemeContext)
}

// ----------------------------------------------------------------
// Provider — applies CSS vars and persists settings locally
// ----------------------------------------------------------------
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(DEFAULT_THEME_SETTINGS)
  const hydratedRef = useRef(false)

  useEffect(() => {
    hydratedRef.current = true
    setSettings(readStoredSettings())
  }, [])

  const update = useCallback((patch: Partial<ThemeSettings>) => {
    setSettings((s) => sanitizeSettings({ ...s, ...patch }))
  }, [])

  const resetSettings = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(CCTV_THEME_STORAGE_KEY)
      window.dispatchEvent(new CustomEvent(CCTV_RESET_EVENT))
    }
    setSettings(DEFAULT_THEME_SETTINGS)
  }, [])

  const palette = useMemo(() => resolvePalette(settings), [settings])
  const t: AnyTranslation = TRANSLATIONS[settings.locale]

  useEffect(() => {
    if (!hydratedRef.current || typeof window === 'undefined') return
    window.localStorage.setItem(CCTV_THEME_STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    const root = document.documentElement
    const textScale = settings.textScale / 100
    const uiScale = settings.uiScale / 100
    const uiZoom = textScale * uiScale
    const uiZoomInverse = uiZoom > 0 ? 1 / uiZoom : 1

    root.style.setProperty('--background',        palette.bg)
    root.style.setProperty('--foreground',        palette.primary)
    root.style.setProperty('--card',              palette.bgCard)
    root.style.setProperty('--card-foreground',   palette.primary)
    root.style.setProperty('--primary',           palette.primary)
    root.style.setProperty('--border',            palette.border)
    root.style.setProperty('--panel',             palette.panelBg)
    root.style.setProperty('--panel-border',      palette.border)
    root.style.setProperty('--crt-green',         palette.primary)
    root.style.setProperty('--muted-foreground',  palette.primaryDim)
    root.style.setProperty('--ring',              palette.primary)
    root.style.setProperty('--input',             palette.bgCard)
    root.style.setProperty('--secondary',         palette.bgCard)
    root.style.setProperty('--muted',             palette.bgCard)
    root.style.setProperty('--destructive',       palette.danger)
    root.style.setProperty('--crt-text-glow',     palette.textGlow)
    root.style.setProperty('--theme-text-scale',  `${settings.textScale}%`)
    root.style.setProperty('--text-scale',        String(textScale))
    root.style.setProperty('--ui-scale',          String(uiScale))
    root.style.setProperty('--ui-zoom',           String(uiZoom))
    root.style.setProperty('--ui-zoom-inverse',   String(uiZoomInverse))
    root.style.setProperty('--grid-gap',          `${settings.gridGap}px`)
    root.style.setProperty('--grid-bg',           palette.gridBg)
    root.style.setProperty('--camera-bg',         palette.cameraBg || 'transparent')
    root.style.setProperty('--overlay-bg',        palette.overlayBg || 'rgba(0,0,0,0.42)')
    root.dataset.cameraStyle = settings.cameraSceneStyle
  }, [settings, palette])

  return (
    <ThemeContext.Provider value={{ settings, update, resetSettings, t, palette }}>
      {children}
    </ThemeContext.Provider>
  )
}
