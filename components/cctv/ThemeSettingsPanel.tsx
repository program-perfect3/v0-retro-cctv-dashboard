'use client'

import type { ReactNode } from 'react'
import {
  DEFAULT_CUSTOM_COLORS,
  THEME_PALETTES,
  getCctvNow,
  useTheme,
  type CustomColorKey,
  type Locale,
  type ThemeColor,
} from '@/lib/themeContext'

interface ThemeSettingsPanelProps {
  onClose: () => void
}

const COLORS: ThemeColor[] = ['green', 'amber', 'red', 'blue', 'white']

const COLOR_LABELS: { key: CustomColorKey; labelRu: string; labelEn: string; fallback: string }[] = [
  { key: 'primary', labelRu: 'Акцент / основной текст', labelEn: 'Accent / main text', fallback: '#39ff78' },
  { key: 'primaryDim', labelRu: 'Вторичный текст', labelEn: 'Secondary text', fallback: '#42a875' },
  { key: 'primaryFaint', labelRu: 'Тусклый текст', labelEn: 'Faint text', fallback: '#244f39' },
  { key: 'background', labelRu: 'Фон страницы', labelEn: 'Page background', fallback: '#030806' },
  { key: 'panelBackground', labelRu: 'Фон панелей', labelEn: 'Panel background', fallback: '#07100c' },
  { key: 'cardBackground', labelRu: 'Фон карточек / инпутов', labelEn: 'Cards / inputs', fallback: '#0b1510' },
  { key: 'border', labelRu: 'Основные рамки', labelEn: 'Main borders', fallback: '#2f7d53' },
  { key: 'borderDim', labelRu: 'Тусклые рамки', labelEn: 'Dim borders', fallback: '#1d4a34' },
  { key: 'danger', labelRu: 'REC / тревога', labelEn: 'REC / danger', fallback: '#ff3d2e' },
  { key: 'gridBackground', labelRu: 'Фон сетки камер', labelEn: 'Camera grid background', fallback: '#020403' },
  { key: 'cameraBackground', labelRu: 'Фон ячейки камеры', labelEn: 'Camera cell background', fallback: '#020b05' },
  { key: 'overlayBackground', labelRu: 'Фон таймкодов', labelEn: 'Timestamp background', fallback: '#000000' },
]

const pad2 = (value: number) => String(value).padStart(2, '0')
const isHexColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value)

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function toTimeInputValue(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

function dateFromInputs(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split('-').map(Number)
  const [hours = 0, minutes = 0, seconds = 0] = timeValue.split(':').map(Number)

  if (!year || !month || !day) return null

  return new Date(year, month - 1, day, hours, minutes, seconds, 0)
}

export default function ThemeSettingsPanel({ onClose }: ThemeSettingsPanelProps) {
  const { settings, update, resetSettings, t, palette } = useTheme()

  const p = palette
  const clockNow = getCctvNow(settings)
  const clockDateValue = toDateInputValue(clockNow)
  const clockTimeValue = toTimeInputValue(clockNow)
  const clockIsCustom = settings.clockBaseTimeMs !== null && settings.clockBaseRealMs !== null
  const localeIsRu = settings.locale === 'ru'

  const setClockFromInputs = (dateValue: string, timeValue: string) => {
    const next = dateFromInputs(dateValue, timeValue)
    if (!next) return

    update({
      clockBaseTimeMs: next.getTime(),
      clockBaseRealMs: Date.now(),
    })
  }

  const setClockToCurrentRealTime = () => {
    const now = new Date()
    update({
      clockBaseTimeMs: now.getTime(),
      clockBaseRealMs: Date.now(),
    })
  }

  const resetClockToDeviceTime = () => {
    update({ clockBaseTimeMs: null, clockBaseRealMs: null })
  }

  const updateCustomColor = (key: CustomColorKey, value: string) => {
    update({ customColors: { ...settings.customColors, [key]: value } })
  }

  const resetCustomColors = () => {
    update({ customColors: DEFAULT_CUSTOM_COLORS })
  }

  const SectionTitle = ({ children }: { children: ReactNode }) => (
    <div style={{ fontSize: '8px', letterSpacing: '0.2em', color: p.primaryFaint, paddingTop: 10, paddingBottom: 5 }}>
      — {children} —
    </div>
  )

  const Row = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex items-center justify-between gap-3 py-1" style={{ borderBottom: `1px solid ${p.borderDim}` }}>
      <span style={{ fontSize: '9px', letterSpacing: '0.12em', color: p.primaryDim, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
        {label}
      </span>
      <div className="flex items-center gap-1.5 flex-shrink-0">{children}</div>
    </div>
  )

  const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) => (
    <button
      onClick={() => onChange(!value)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
      }}
      aria-pressed={value}
    >
      <div style={{
        width: 28,
        height: 13,
        borderRadius: 2,
        border: `1px solid ${value ? p.primary : p.primaryFaint}`,
        background: value ? `${p.primary}22` : `${p.bg}`,
        boxShadow: value ? `0 0 5px ${p.primary}88, inset 0 0 4px ${p.primary}44` : 'none',
        position: 'relative',
        transition: 'all 0.15s',
      }}>
        <div style={{
          position: 'absolute',
          top: 2,
          left: value ? 16 : 2,
          width: 7,
          height: 7,
          borderRadius: 1,
          background: value ? p.primary : p.primaryFaint,
          boxShadow: value ? `0 0 4px ${p.primary}` : 'none',
          transition: 'all 0.15s',
        }} />
      </div>
      {label && (
        <span style={{ fontSize: '8px', letterSpacing: '0.1em', color: value ? p.primary : p.primaryFaint }}>
          {label}
        </span>
      )}
    </button>
  )

  const Slider = ({
    label,
    value,
    min,
    max,
    step,
    onChange,
    suffix = '%',
  }: {
    label: string
    value: number
    min: number
    max: number
    step: number
    onChange: (value: number) => void
    suffix?: string
  }) => (
    <div className="flex items-center gap-3 pb-3" style={{ borderBottom: `1px solid ${p.borderDim}` }}>
      <span style={{ fontSize: '9px', color: p.primaryDim, minWidth: 96, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="cctv-range"
        style={{ flex: 1, accentColor: p.primary }}
      />
      <span style={{ fontSize: '8px', color: p.primary, minWidth: 42, textAlign: 'right' }}>
        {value}{suffix}
      </span>
    </div>
  )

  return (
    <div
      className="flex flex-col"
      style={{
        width: '100%',
        height: '100%',
        background: palette.panelBg,
        border: `1px solid ${p.border}`,
        boxShadow: `0 0 20px ${p.primary}33, inset 0 0 30px rgba(0,0,0,0.5)`,
        fontFamily: 'var(--font-share-tech-mono), monospace',
        overflow: 'hidden',
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-4 flex-shrink-0"
        style={{
          height: 38,
          borderBottom: `1px solid ${p.border}`,
          background: palette.bgCard,
        }}
      >
        <div className="flex items-center gap-3">
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.primary, boxShadow: `0 0 6px ${p.primary}` }} />
          <span style={{
            fontSize: '11px',
            letterSpacing: '0.22em',
            color: p.primary,
            textShadow: settings.glow ? p.textGlow : 'none',
          }}>
            {t.settingsTitle}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={resetSettings}
            className="cctv-btn cctv-btn-red"
            style={{ fontSize: '8px', padding: '2px 8px' }}
            title={localeIsRu ? 'Сбросить все локальные настройки' : 'Reset all local settings'}
          >
            RESET
          </button>
          <button
            onClick={onClose}
            style={{
              fontSize: '9px',
              letterSpacing: '0.15em',
              color: p.primaryDim,
              background: 'none',
              border: `1px solid ${p.borderDim}`,
              padding: '2px 8px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {t.close} ×
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-0">
        {/* ── COLOUR THEME ── */}
        <SectionTitle>{t.colorTheme}</SectionTitle>

        <div className="flex flex-wrap gap-1.5 pb-3" style={{ borderBottom: `1px solid ${p.borderDim}` }}>
          {COLORS.map((c) => {
            const cp = THEME_PALETTES[c]
            const active = settings.color === c
            return (
              <button
                key={c}
                onClick={() => update({ color: c })}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 8px',
                  background: active ? `${cp.primary}18` : 'transparent',
                  border: `1px solid ${active ? cp.primary : cp.primaryFaint}`,
                  cursor: 'pointer',
                  boxShadow: active ? `0 0 8px ${cp.primary}55` : 'none',
                  transition: 'all 0.15s',
                  minWidth: 64,
                }}
              >
                <div style={{
                  width: 24,
                  height: 10,
                  background: cp.primary,
                  boxShadow: active ? `0 0 6px ${cp.primary}` : 'none',
                  borderRadius: 1,
                }} />
                <span style={{
                  fontSize: '7px',
                  letterSpacing: '0.08em',
                  color: active ? cp.primary : cp.primaryFaint,
                  fontFamily: 'var(--font-share-tech-mono), monospace',
                  textTransform: 'uppercase',
                }}>
                  {localeIsRu ? cp.labelRu : cp.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── CUSTOM COLORS ── */}
        <SectionTitle>{localeIsRu ? 'ЦВЕТА ЭЛЕМЕНТОВ' : 'ELEMENT COLORS'}</SectionTitle>

        <div className="flex flex-col gap-1 pb-3" style={{ borderBottom: `1px solid ${p.borderDim}` }}>
          {COLOR_LABELS.map((item) => {
            const current = settings.customColors[item.key]
            const inputValue = isHexColor(current) ? current : item.fallback
            return (
              <div key={item.key} className="flex items-center justify-between gap-2 py-0.5">
                <span style={{ fontSize: '8px', letterSpacing: '0.08em', color: p.primaryDim, textTransform: 'uppercase' }}>
                  {localeIsRu ? item.labelRu : item.labelEn}
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={inputValue}
                    onChange={(e) => updateCustomColor(item.key, e.target.value)}
                    style={{ width: 28, height: 20, padding: 0, border: `1px solid ${current ? p.primary : p.borderDim}`, background: 'transparent', cursor: 'pointer' }}
                  />
                  <input
                    className="cctv-input"
                    value={current}
                    onChange={(e) => updateCustomColor(item.key, e.target.value)}
                    placeholder={item.fallback}
                    style={{ width: 92, padding: '2px 5px', fontSize: '8px' }}
                  />
                  <button
                    className="cctv-btn"
                    onClick={() => updateCustomColor(item.key, '')}
                    style={{ padding: '2px 6px', fontSize: '8px', opacity: current ? 1 : 0.5 }}
                  >
                    CLR
                  </button>
                </div>
              </div>
            )
          })}
          <button className="cctv-btn cctv-btn-red" onClick={resetCustomColors} style={{ marginTop: 4, padding: '3px 8px', fontSize: '8px' }}>
            {localeIsRu ? 'СБРОСИТЬ ЦВЕТА ЭЛЕМЕНТОВ' : 'RESET ELEMENT COLORS'}
          </button>
        </div>

        {/* ── LANGUAGE ── */}
        <SectionTitle>{t.localeLabel}</SectionTitle>

        <div className="flex gap-1.5 pb-3" style={{ borderBottom: `1px solid ${p.borderDim}` }}>
          {(['ru', 'en'] as Locale[]).map((loc) => (
            <button
              key={loc}
              onClick={() => update({ locale: loc })}
              style={{
                padding: '3px 12px',
                fontSize: '9px',
                letterSpacing: '0.15em',
                fontFamily: 'var(--font-share-tech-mono), monospace',
                background: settings.locale === loc ? `${p.primary}20` : 'transparent',
                border: `1px solid ${settings.locale === loc ? p.primary : p.primaryFaint}`,
                color: settings.locale === loc ? p.primary : p.primaryFaint,
                cursor: 'pointer',
                boxShadow: settings.locale === loc ? `0 0 6px ${p.primary}44` : 'none',
              }}
            >
              {loc === 'ru' ? 'РУС' : 'ENG'}
            </button>
          ))}
        </div>

        {/* ── TITLES ── */}
        <SectionTitle>{localeIsRu ? 'ТЕКСТЫ ПАНЕЛЕЙ' : 'PANEL TEXT'}</SectionTitle>
        <div className="flex flex-col gap-1.5 pb-3" style={{ borderBottom: `1px solid ${p.borderDim}` }}>
          <input className="cctv-input" value={settings.customSystemTitle} onChange={(e) => update({ customSystemTitle: e.target.value })} placeholder={t.systemTitle} />
          <input className="cctv-input" value={settings.customSystemSub} onChange={(e) => update({ customSystemSub: e.target.value })} placeholder={t.systemSub} />
          <input className="cctv-input" value={settings.customPanelTitle} onChange={(e) => update({ customPanelTitle: e.target.value })} placeholder={t.panelTitle} />
          <input className="cctv-input" value={settings.customPanelVer} onChange={(e) => update({ customPanelVer: e.target.value })} placeholder={t.panelVer} />
        </div>

        {/* ── CLOCK ── */}
        <SectionTitle>{t.clockTitle}</SectionTitle>

        <div className="flex flex-col gap-2 pb-3" style={{ borderBottom: `1px solid ${p.borderDim}` }}>
          <div className="flex items-center gap-2">
            <label style={{ fontSize: '8px', color: p.primaryDim, letterSpacing: '0.1em', minWidth: 42 }}>{t.clockDate}</label>
            <input
              className="cctv-input"
              type="date"
              value={clockDateValue}
              onChange={(e) => setClockFromInputs(e.target.value, clockTimeValue)}
              style={{ fontSize: '9px', padding: '3px 6px', colorScheme: 'dark' }}
            />
          </div>
          <div className="flex items-center gap-2">
            <label style={{ fontSize: '8px', color: p.primaryDim, letterSpacing: '0.1em', minWidth: 42 }}>{t.clockTime}</label>
            <input
              className="cctv-input"
              type="time"
              step={1}
              value={clockTimeValue}
              onChange={(e) => setClockFromInputs(clockDateValue, e.target.value)}
              style={{ fontSize: '9px', padding: '3px 6px', colorScheme: 'dark' }}
            />
          </div>
          <div className="flex gap-1.5">
            <button className="cctv-btn" onClick={setClockToCurrentRealTime} style={{ padding: '3px 8px', fontSize: '8px' }}>
              {t.clockNow}
            </button>
            <button className="cctv-btn" onClick={resetClockToDeviceTime} style={{ padding: '3px 8px', fontSize: '8px', opacity: clockIsCustom ? 1 : 0.55 }}>
              {t.clockReset}
            </button>
          </div>
        </div>

        {/* ── SIZE ── */}
        <SectionTitle>{localeIsRu ? 'РАЗМЕРЫ' : 'SIZING'}</SectionTitle>
        <Slider label={t.textSize} value={settings.textScale} min={70} max={170} step={5} onChange={(textScale) => update({ textScale })} />
        <Slider label={localeIsRu ? 'Элементы' : 'Elements'} value={settings.uiScale} min={75} max={150} step={5} onChange={(uiScale) => update({ uiScale })} />

        {/* ── GRID GAP ── */}
        <SectionTitle>{t.gridGap}</SectionTitle>
        <Slider label={t.gridGap} value={settings.gridGap} min={0} max={12} step={1} suffix={t.px} onChange={(gridGap) => update({ gridGap })} />

        {/* ── VISIBILITY ── */}
        <SectionTitle>{localeIsRu ? 'ПАНЕЛИ' : 'PANELS'}</SectionTitle>
        <Row label={localeIsRu ? 'Верхняя панель' : 'Top panel'}>
          <Toggle value={settings.showTopPanel} onChange={(v) => update({ showTopPanel: v })} />
        </Row>
        <Row label={localeIsRu ? 'Нижняя панель' : 'Bottom panel'}>
          <Toggle value={settings.showBottomPanel} onChange={(v) => update({ showBottomPanel: v })} />
        </Row>
        <Row label={localeIsRu ? 'Бегущая строка' : 'Ticker'}>
          <Toggle value={settings.showTicker} onChange={(v) => update({ showTicker: v })} />
        </Row>
        <Row label={localeIsRu ? 'Статусы' : 'Status pills'}>
          <Toggle value={settings.showStatusPills} onChange={(v) => update({ showStatusPills: v })} />
        </Row>

        {/* ── EFFECTS ── */}
        <SectionTitle>{t.effects}</SectionTitle>
        <Row label={t.scanlines}>
          <Toggle value={settings.scanlines} onChange={(v) => update({ scanlines: v })} />
        </Row>
        <Row label={t.noise}>
          <Toggle value={settings.noise} onChange={(v) => update({ noise: v })} />
        </Row>
        <Row label={t.glow}>
          <Toggle value={settings.glow} onChange={(v) => update({ glow: v })} />
        </Row>
        <Row label={t.flicker}>
          <Toggle value={settings.flicker} onChange={(v) => update({ flicker: v })} />
        </Row>
        <Row label={t.vignette}>
          <Toggle value={settings.vignette} onChange={(v) => update({ vignette: v })} />
        </Row>
        <Row label={t.timestamps}>
          <Toggle value={settings.timestampVisible} onChange={(v) => update({ timestampVisible: v })} />
        </Row>

        <div style={{ height: 16 }} />
      </div>
    </div>
  )
}
