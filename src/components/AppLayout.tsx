import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'

import { DockNav } from '@/components/DockNav'
import ErrorBoundary from '@/components/ErrorBoundary'

export const AppLayout = () => {
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.info('[thedrop] AppLayout mounted')
    }
    return () => {
      if (import.meta.env.DEV) {
        console.info('[thedrop] AppLayout unmounted')
      }
    }
  }, [])

  return (
    <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-32 pt-10 sm:px-8">
      <main className="mt-6 flex-1">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <DockNav />
    </div>
  )
}

export default AppLayout
