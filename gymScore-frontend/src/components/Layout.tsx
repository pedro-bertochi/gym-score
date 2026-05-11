import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { LgpdBanner } from './LgpdBanner'

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      <main className="pb-24">
        <Outlet />
      </main>
      <BottomNav />
      <LgpdBanner />
    </div>
  )
}
