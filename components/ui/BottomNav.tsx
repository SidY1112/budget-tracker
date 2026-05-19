'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Inline SVGs keep the component dependency-free — stroke="currentColor" lets Tailwind text colour
// classes control the icon colour automatically alongside the label
function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}

function MinusCircleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  )
}

function PlusCircleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  )
}

function BarChartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="12" width="4" height="9" />
      <rect x="10" y="7" width="4" height="14" />
      <rect x="17" y="3" width="4" height="18" />
    </svg>
  )
}

function UserCircleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.168 18.849A4 4 0 0 1 10 16h4a4 4 0 0 1 3.832 2.849" />
    </svg>
  )
}

const links = [
  { href: '/dashboard',               label: 'Dashboard', icon: <HomeIcon /> },
  { href: '/dashboard/expenses',      label: 'Expense',   icon: <MinusCircleIcon /> },
  { href: '/dashboard/add-income',    label: 'Income',    icon: <PlusCircleIcon /> },
  { href: '/dashboard/create-budget', label: 'Budget',    icon: <BarChartIcon /> },
  { href: '/dashboard/profile',       label: 'Profile',   icon: <UserCircleIcon /> },
]

// Visible on mobile only — the sidebar handles navigation at md and above
export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-gray-200 bg-white md:hidden">
      {links.map(({ href, label, icon }) => {
        // Dashboard root uses exact match to avoid highlighting on every sub-route
        const isActive = href === '/dashboard' ? pathname === href : pathname.startsWith(href)

        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
              isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {icon}
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
