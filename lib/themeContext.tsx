'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
export type ThemeColor = 'green' | 'amber' | 'red' | 'blue' | 'white'
export type Locale = 'en' | 'ru'

export interface ThemeSettings {
  color: ThemeColor
  textScale: number        // 80 – 130 (%)
  scanlines: boolean
  noise: boolean
  glow: boolean
  flicker: boolean
  vignette: boolean
  locale: Locale
  gridGap: number          // 0 – 6 px
  timestampVisible: boolean
  clockBaseTimeMs: number | null
  clockBaseRealMs: number | null
}

const DEFAULTS: ThemeSettings = {
  color: 'green',
  textScale: 100,
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
export const THEME_PALETTES: Record<ThemeColor, {
  hue: number
  label: string
  labelRu: string
  primary: string
  primaryDim: string
  primaryFaint: string
  bg: string
  bgCard: string
  border: string
  borderDim: string
  textGlow: string
  amberHue: number
}> = {
  green: {
    hue: 145,
    label: 'PHOSPHOR GREEN',
    labelRu: 'ЗЕЛЕНЫЙ ФОСФОР',
    primary:      'oklch(0.72 0.22 145)',
    primaryDim:   'oklch(0.48 0.10 145)',
    primaryFaint: 'oklch(0.25 0.05 145)',
    bg:           'oklch(0.045 0.004 200)',
    bgCard:       'oklch(0.07 0.005 200)',
    border:       'oklch(0.28 0.07 145)',
    borderDim:    'oklch(0.18 0.04 145)',
    textGlow:     '0 0 6px oklch(0.72 0.22 145 / 0.7), 0 0 14px oklch(0.55 0.22 145 / 0.35)',
    amberHue:     75,
  },
  amber: {
    hue: 75,
    label: 'AMBER CRT',
    labelRu: 'ЯНТАРНЫЙ ЭЛТ',
    primary:      'oklch(0.78 0.2 75)',
    primaryDim:   'oklch(0.5 0.1 75)',
    primaryFaint: 'oklch(0.28 0.05 75)',
    bg:           'oklch(0.045 0.004 60)',
    bgCard:       'oklch(0.07 0.005 60)',
    border:       'oklch(0.3 0.08 75)',
    borderDim:    'oklch(0.2 0.05 75)',
    textGlow:     '0 0 6px oklch(0.78 0.2 75 / 0.7), 0 0 14px oklch(0.6 0.2 75 / 0.35)',
    amberHue:     75,
  },
  red: {
    hue: 25,
    label: 'RED ALERT',
    labelRu: 'КРАСНАЯ ТРЕВОГА',
    primary:      'oklch(0.68 0.22 25)',
    primaryDim:   'oklch(0.45 0.12 25)',
    primaryFaint: 'oklch(0.25 0.06 25)',
    bg:           'oklch(0.045 0.005 20)',
    bgCard:       'oklch(0.07 0.006 20)',
    border:       'oklch(0.28 0.09 25)',
    borderDim:    'oklch(0.18 0.05 25)',
    textGlow:     '0 0 6px oklch(0.68 0.22 25 / 0.7), 0 0 14px oklch(0.5 0.22 25 / 0.35)',
    amberHue:     40,
  },
  blue: {
    hue: 240,
    label: 'NIGHT VISION',
    labelRu: 'НОЧНОЕ ВИДЕНИЕ',
    primary:      'oklch(0.68 0.18 240)',
    primaryDim:   'oklch(0.45 0.1 240)',
    primaryFaint: 'oklch(0.25 0.05 240)',
    bg:           'oklch(0.045 0.005 240)',
    bgCard:       'oklch(0.07 0.006 240)',
    border:       'oklch(0.28 0.07 240)',
    borderDim:    'oklch(0.18 0.04 240)',
    textGlow:     '0 0 6px oklch(0.68 0.18 240 / 0.7), 0 0 14px oklch(0.5 0.18 240 / 0.35)',
    amberHue:     210,
  },
  white: {
    hue: 200,
    label: 'MONOCHROME',
    labelRu: 'МОНОХРОМ',
    primary:      'oklch(0.82 0.02 200)',
    primaryDim:   'oklch(0.55 0.015 200)',
    primaryFaint: 'oklch(0.28 0.01 200)',
    bg:           'oklch(0.04 0.002 200)',
    bgCard:       'oklch(0.08 0.003 200)',
    border:       'oklch(0.32 0.02 200)',
    borderDim:    'oklch(0.2 0.01 200)',
    textGlow:     '0 0 4px oklch(0.82 0.02 200 / 0.5)',
    amberHue:     200,
  },
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
type AnyPalette = typeof THEME_PALETTES[keyof typeof THEME_PALETTES]

interface ThemeContextValue {
  settings: ThemeSettings
  update: (patch: Partial<ThemeSettings>) => void
  t: AnyTranslation
  palette: AnyPalette
}

const ThemeContext = createContext<ThemeContextValue>({
  settings: DEFAULTS,
  update: () => {},
  t: TRANSLATIONS.en as AnyTranslation,
  palette: THEME_PALETTES.green as AnyPalette,
})

export function useTheme() {
  return useContext(ThemeContext)
}

// ----------------------------------------------------------------
// Provider — applies CSS vars to :root on every change
// ----------------------------------------------------------------
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(DEFAULTS)

  const update = (patch: Partial<ThemeSettings>) =>
    setSettings((s) => ({ ...s, ...patch }))

  const palette: AnyPalette = THEME_PALETTES[settings.color]
  const t: AnyTranslation = TRANSLATIONS[settings.locale]

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--background',        palette.bg)
    root.style.setProperty('--foreground',        palette.primary)
    root.style.setProperty('--card',              palette.bgCard)
    root.style.setProperty('--card-foreground',   palette.primary)
    root.style.setProperty('--primary',           palette.primary)
    root.style.setProperty('--border',            palette.border)
    root.style.setProperty('--panel-border',      palette.border)
    root.style.setProperty('--crt-green',         palette.primary)
    root.style.setProperty('--muted-foreground',  palette.primaryDim)
    root.style.setProperty('--ring',              palette.primary)
    root.style.setProperty('--input',             palette.bgCard)
    root.style.setProperty('--secondary',         palette.bgCard)
    root.style.setProperty('--muted',             palette.bgCard)
    root.style.setProperty('--crt-text-glow',     palette.textGlow)
    root.style.setProperty('--theme-text-scale',  `${settings.textScale}%`)
    root.style.setProperty('--grid-gap',          `${settings.gridGap}px`)
  }, [settings.color, settings.textScale, settings.gridGap, palette])

  return (
    <ThemeContext.Provider value={{ settings, update, t, palette }}>
      {children}
    </ThemeContext.Provider>
  )
}
