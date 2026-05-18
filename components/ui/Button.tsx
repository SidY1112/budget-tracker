import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}

// Two-variant button: primary for CTAs (indigo), secondary for back/cancel actions (subtle gray text)
export default function Button({ variant = 'primary', className = '', ...props }: Props) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
  const styles: Record<Variant, string> = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'text-gray-500 hover:text-gray-700 focus:ring-gray-400',
  }
  return <button {...props} className={`${base} ${styles[variant]} ${className}`} />
}
