import Card from '@/components/ui/Card'

type Props = {
  label: string
  value: string
  // Allows callers to colour the value differently (e.g. green for positive balance, red for negative)
  valueColor?: string
}

// Displays a single KPI metric — label above, large value below
export default function StatCard({ label, value, valueColor = 'text-gray-900' }: Props) {
  return (
    <Card className="p-6">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${valueColor}`}>{value}</p>
    </Card>
  )
}
