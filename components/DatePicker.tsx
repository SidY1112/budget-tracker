'use client'

type Props = {
  value: string
  onChange: (value: string) => void
  mode?: 'date' | 'month'
}

// Computes the correct max at render time so the cap is always relative to now,
// not a value baked in when the module was first loaded
function getMax(mode: 'date' | 'month') {
  const iso = new Date().toISOString()
  return mode === 'month' ? iso.slice(0, 7) : iso.slice(0, 10)
}

// Centralises date/month input with its max constraint so every form that needs a
// date picker gets consistent behaviour without duplicating the cap logic
export default function DatePicker({ value, onChange, mode = 'date' }: Props) {
  return (
    <input
      type={mode}
      value={value}
      max={getMax(mode)}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
