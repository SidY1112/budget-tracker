'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/expenses', label: 'Add Expense' },
  { href: '/dashboard/add-income', label: 'Add Income' },
  { href: '/dashboard/create-budget', label: 'Create Budget' },
  { href: '/dashboard/profile', label: 'Profile' },
]

// Active link detection is client-side because usePathname() requires a client component;
// the sidebar shell itself stays a server component
export default function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 p-3">
      {links.map(({ href, label }) => {
        // Dashboard root uses exact match to avoid lighting up on every sub-route
        const isActive = href === '/dashboard' ? pathname === href : pathname.startsWith(href)

        return (
          <Link
            key={href}
            href={href}
            className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
