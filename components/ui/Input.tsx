import { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement>

// Centralises text-field appearance so every input across the app looks identical
export default function Input({ className = '', ...props }: Props) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
    />
  )
}
