import { ReactNode } from 'react'

type Variant = 'green' | 'red' | 'gray'

type Props = {
  children: ReactNode
  variant?: Variant
}

const styles: Record<Variant, string> = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-600',
}

// Small pill label — used for status tags like "On track", "Over budget", "Recurring"
export default function Badge({ children, variant = 'gray' }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  )
}
