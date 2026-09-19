import React, { useEffect, useMemo, useState } from 'react';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';

type ReusableDatePageProps = {
  title: string;
  description: string;
  value?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  min?: string;
  max?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  label?: string;
  mode?: 'auto' | 'date' | 'datetime-local' | 'time';
  showNowBar?: boolean;
};

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', paddingBottom: '132px', color: theme.text },
  shell: { width: '100%', maxWidth: '760px', margin: '0 auto', padding: 'clamp(16px, 4vw, 34px) 16px 40px', boxSizing: 'border-box' as const },
  card: { borderRadius: '26px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, padding: 'clamp(18px, 4vw, 30px)', boxShadow: `0 20px 60px ${theme.borderGlass}` },
  eyebrow: { margin: 0, color: theme.textMuted, fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const },
  title: { margin: '8px 0 0', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 900, letterSpacing: '-0.03em' },
  description: { margin: '8px 0 24px', color: theme.textMuted, lineHeight: 1.65 },
  calendarHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '18px' },
  pickerGroup: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flex: 1 },
  pickerWrapper: { position: 'relative' as const },
  picker: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box' as const, borderRadius: '12px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.text, padding: '10px 12px', font: 'inherit', fontWeight: 800, cursor: 'pointer', outline: 'none', minWidth: '116px', textAlign: 'left' as const },
  pickerLabel: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  pickerArrow: { marginLeft: 'auto', paddingLeft: '12px', flexShrink: 0, lineHeight: 1 },
  pickerMenu: { position: 'absolute' as const, zIndex: 10, top: 'calc(100% + 6px)', left: 0, right: 0, maxHeight: '240px', overflowY: 'auto' as const, padding: '6px', borderRadius: '14px', border: `1px solid ${theme.borderGlass}`, background: theme.surface, boxShadow: `0 16px 36px ${theme.borderGlass}` },
  pickerOption: { display: 'block', width: '100%', border: 0, borderRadius: '9px', background: 'transparent', color: theme.text, padding: '9px 10px', font: 'inherit', fontWeight: 700, textAlign: 'left' as const, cursor: 'pointer' },
  selectedPickerOption: { background: theme.primary, color: theme.textInverse },
  navButton: { width: '38px', height: '38px', borderRadius: '12px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.text, cursor: 'pointer', fontSize: '1.35rem', lineHeight: 1 },
  weekdays: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '6px' },
  weekday: { color: theme.textMuted, fontSize: '0.7rem', fontWeight: 800, textAlign: 'center' as const, textTransform: 'uppercase' as const },
  days: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' },
  day: { aspectRatio: '1', minHeight: '38px', borderRadius: '13px', border: '1px solid transparent', background: 'transparent', color: theme.text, cursor: 'pointer', fontWeight: 800 },
  selectedDay: { background: theme.primary, color: theme.textInverse, borderColor: theme.primary },
  disabledDay: { color: theme.textMuted, opacity: 0.35, cursor: 'not-allowed' },
  emptyDay: { aspectRatio: '1' },
  field: { display: 'grid', gap: '7px', marginTop: '22px' },
  label: { color: theme.textMuted, fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' as const },
  input: { width: '100%', boxSizing: 'border-box' as const, borderRadius: '14px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.text, padding: '12px 14px', outline: 'none', font: 'inherit' },
  actions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' as const, marginTop: '24px' },
  primary: { borderRadius: '14px', border: `1px solid ${theme.primary}`, padding: '12px 18px', cursor: 'pointer', fontWeight: 800, background: theme.primary, color: theme.textInverse },
  secondary: { borderRadius: '14px', border: `1px solid ${theme.borderGlass}`, padding: '12px 18px', cursor: 'pointer', fontWeight: 800, background: theme.surfaceMuted, color: theme.text },
});

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ReusableDatePage = ({
  title, description, value = '', onConfirm, onCancel, min, max,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel', label, mode = 'auto', showNowBar = true,
}: ReusableDatePageProps) => {
  const resolvedMode: 'date' | 'datetime-local' | 'time' = mode === 'auto' ? (value.includes('T') ? 'datetime-local' : 'date') : mode;
  const resolvedLabel = label ?? (resolvedMode === 'time' ? 'Time' : resolvedMode === 'datetime-local' ? 'Date and time' : 'Date');
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const initialDate = value.split('T')[0] || toDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [time, setTime] = useState(value.split('T')[1]?.slice(0, 5) || '12:00');
  const [month, setMonth] = useState(() => {
    const parsed = new Date(`${initialDate}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  });
  const [openPicker, setOpenPicker] = useState<'month' | 'year' | null>(null);

  useEffect(() => {
    const nextDate = value.split('T')[0] || toDateKey(new Date());
    setSelectedDate(nextDate);
    if (value.includes('T')) setTime(value.split('T')[1]?.slice(0, 5) || '12:00');
    const parsed = new Date(`${nextDate}T12:00:00`);
    if (!Number.isNaN(parsed.getTime())) setMonth(parsed);
  }, [value]);

  const calendarDays = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return { leading: first.getDay(), days: Array.from({ length: count }, (_, index) => index + 1) };
  }, [month]);

  const isAllowed = (dateKey: string) => (!min || dateKey >= min.split('T')[0]) && (!max || dateKey <= max.split('T')[0]);
  const outputValue = resolvedMode === 'datetime-local' ? `${selectedDate}T${time}` : resolvedMode === 'time' ? time : selectedDate;
  const monthOptions = Array.from({ length: 12 }, (_, index) => new Date(2000, index, 1).toLocaleDateString(undefined, { month: 'long' }));
  const currentYear = new Date().getFullYear();
  const minYear = min ? Number(min.slice(0, 4)) : currentYear - 120;
  const maxYear = max ? Number(max.slice(0, 4)) : currentYear + 20;
  const yearOptions = Array.from({ length: Math.max(1, maxYear - minYear + 1) }, (_, index) => minYear + index);
  const changeMonth = (offset: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1));
  const changePickerMonth = (nextMonth: number, nextYear = month.getFullYear()) => setMonth(new Date(nextYear, nextMonth, 1));

  return (
    <HybridTheme mode={themeMode}>
      <div style={styles.page}>
        <main style={styles.shell}>
          <section style={styles.card}>
            <p style={styles.eyebrow}>Calendar picker</p>
            <h1 style={styles.title}>{title}</h1>
            <p style={styles.description}>{description}</p>
            {resolvedMode !== 'time' ? (
              <>
                <div style={styles.calendarHeader}>
                  <button type="button" aria-label="Previous month" style={styles.navButton} onClick={() => changeMonth(-1)}>‹</button>
                  <div style={styles.pickerGroup}>
                    <div style={styles.pickerWrapper}>
                      <button type="button" aria-haspopup="listbox" aria-expanded={openPicker === 'month'} aria-label="Choose month" style={styles.picker} onClick={() => setOpenPicker(openPicker === 'month' ? null : 'month')}>
                        <span style={styles.pickerLabel}>{monthOptions[month.getMonth()]}</span><span style={styles.pickerArrow} aria-hidden="true">⌄</span>
                      </button>
                      {openPicker === 'month' ? <div role="listbox" aria-label="Months" style={styles.pickerMenu}>
                        {monthOptions.map((monthName, index) => <button key={monthName} type="button" role="option" aria-selected={month.getMonth() === index} style={{ ...styles.pickerOption, ...(month.getMonth() === index ? styles.selectedPickerOption : {}) }} onClick={() => { changePickerMonth(index); setOpenPicker(null); }}>{monthName}</button>)}
                      </div> : null}
                    </div>
                    <div style={styles.pickerWrapper}>
                      <button type="button" aria-haspopup="listbox" aria-expanded={openPicker === 'year'} aria-label="Choose year" style={styles.picker} onClick={() => setOpenPicker(openPicker === 'year' ? null : 'year')}>
                        <span style={styles.pickerLabel}>{month.getFullYear()}</span><span style={styles.pickerArrow} aria-hidden="true">⌄</span>
                      </button>
                      {openPicker === 'year' ? <div role="listbox" aria-label="Years" style={styles.pickerMenu}>
                        {yearOptions.map((year) => <button key={year} type="button" role="option" aria-selected={month.getFullYear() === year} style={{ ...styles.pickerOption, ...(month.getFullYear() === year ? styles.selectedPickerOption : {}) }} onClick={() => { changePickerMonth(month.getMonth(), year); setOpenPicker(null); }}>{year}</button>)}
                      </div> : null}
                    </div>
                  </div>
                  <button type="button" aria-label="Next month" style={styles.navButton} onClick={() => changeMonth(1)}>›</button>
                </div>
                <div style={styles.weekdays}>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day} style={styles.weekday}>{day}</span>)}</div>
                <div style={styles.days}>
                  {Array.from({ length: calendarDays.leading }, (_, index) => <span key={`empty-${index}`} style={styles.emptyDay} />)}
                  {calendarDays.days.map((day) => {
                    const dateKey = toDateKey(new Date(month.getFullYear(), month.getMonth(), day));
                    const allowed = isAllowed(dateKey);
                    return <button key={dateKey} type="button" disabled={!allowed} style={{ ...styles.day, ...(selectedDate === dateKey ? styles.selectedDay : {}), ...(!allowed ? styles.disabledDay : {}) }} onClick={() => setSelectedDate(dateKey)}>{day}</button>;
                  })}
                </div>
              </>
            ) : null}
            {resolvedMode === 'datetime-local' || resolvedMode === 'time' ? <div style={styles.field}><label style={styles.label} htmlFor="reusable-time-input">{resolvedMode === 'time' ? resolvedLabel : 'Time'}</label><input id="reusable-time-input" style={styles.input} type="time" value={time} onChange={(event) => setTime(event.target.value)} /></div> : null}
            <div style={styles.actions}>
              <button type="button" style={styles.secondary} onClick={onCancel}>{cancelLabel}</button>
              <button type="button" style={styles.primary} onClick={() => onConfirm(outputValue)} disabled={!selectedDate}>{confirmLabel}</button>
            </div>
          </section>
        </main>
        {showNowBar ? <NowBar /> : null}
      </div>
    </HybridTheme>
  );
};

export default ReusableDatePage;
