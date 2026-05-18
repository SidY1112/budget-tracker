import { SelectHTMLAttributes } from 'react'

type Props = SelectHTMLAttributes<HTMLSelectElement>

// Centralises dropdown appearance to match Input so all form controls look like a unified set
export default function Select({ className = '', ...props }: Props) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
    />
  )
}
