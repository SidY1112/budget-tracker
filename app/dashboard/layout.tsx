import { ReactNode } from 'react'
import SidebarNav from '@/components/ui/SidebarNav'

// Wraps every dashboard sub-route with the sidebar — auth is handled per-page, not here
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-60 flex-shrink-0 border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-5">
          <span className="text-base font-semibold text-gray-900">Budget Tracker</span>
        </div>
        <SidebarNav />
      </aside>
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
