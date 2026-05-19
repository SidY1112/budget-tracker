import { ReactNode } from 'react'
import SidebarNav from '@/components/ui/SidebarNav'
import BottomNav from '@/components/ui/BottomNav'

// Wraps every dashboard sub-route with the sidebar — auth is handled per-page, not here
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar: hidden on mobile, shown from md breakpoint up */}
        <aside className="hidden md:flex md:w-60 md:flex-shrink-0 md:flex-col border-r border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-5">
            <span className="text-base font-semibold text-gray-900">Budget Tracker</span>
          </div>
          <SidebarNav />
        </aside>

        {/* pb-20 on mobile reserves space above the fixed bottom nav */}
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </div>
      </div>

      {/* Rendered outside the scroll container so it stays fixed to the viewport */}
      <BottomNav />
    </>
  )
}
