import { ReactNode } from 'react'
import Link from 'next/link'

type Props = {
  title: string
  children: ReactNode
  // Optional footer link so auth pages can cross-link without duplicating the layout
  footer?: { text: string; linkLabel: string; href: string }
}

// Centers a white card on the gray-50 background — shared by login and signup so
// both pages stay visually identical without duplicating layout markup
export default function AuthCard({ title, children, footer }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-2xl font-semibold text-gray-900">{title}</h1>
          {children}
        </div>
        {footer && (
          <p className="mt-4 text-center text-sm text-gray-500">
            {footer.text}{' '}
            <Link href={footer.href} className="font-medium text-indigo-600 hover:text-indigo-500">
              {footer.linkLabel}
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
