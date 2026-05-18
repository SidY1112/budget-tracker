type Props = {
  value: number
  max: number
  overBudget?: boolean
}

// Clamps fill at 100% so an over-budget bar doesn't overflow its track
export default function ProgressBar({ value, max, overBudget = false }: Props) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const fill = overBudget ? 'bg-red-500' : 'bg-green-500'

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className={`h-2 rounded-full transition-all ${fill}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
