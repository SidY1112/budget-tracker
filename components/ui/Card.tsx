import { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
}

// Base white card shell — all dashboard sections use this so the shadow/border stays consistent
export default function Card({ children, className = '' }: Props) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  )
}
