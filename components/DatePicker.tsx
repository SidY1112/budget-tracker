'use client'

import Input from '@/components/ui/Input'

type Props = {
  value: string
  onChange: (value: string) => void
  mode?: 'date' | 'month'
  // undefined = default cap at today (backward-compatible); null = no upper bound; string = explicit cap
  max?: string | null
  min?: string
}

// Computes the correct max at render time so the cap is always relative to now,
// not a value baked in when the module was first loaded
function getDefaultMax(mode: 'date' | 'month') {
  const iso = new Date().toISOString()
  return mode === 'month' ? iso.slice(0, 7) : iso.slice(0, 10)
}

// Centralises date/month input with its bound constraints so every form gets
// consistent behaviour without duplicating the cap logic
export default function DatePicker({ value, onChange, mode = 'date', max, min }: Props) {
  const resolvedMax = max === undefined ? getDefaultMax(mode) : max

  return (
    <Input
      type={mode}
      value={value}
      {...(resolvedMax !== null ? { max: resolvedMax } : {})}
      {...(min !== undefined ? { min } : {})}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
