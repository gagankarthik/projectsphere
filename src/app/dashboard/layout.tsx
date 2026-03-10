"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { useAuth } from "@/hooks/use-auth"
import { LoadingSpinner } from "@/components/shared/loading-spinner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Handle hydration - wait for client mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect to login if not authenticated (after loading completes)
  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.replace("/auth/login")
    }
  }, [isAuthenticated, isLoading, router, mounted])

  // Show loading during initial mount or while checking auth
  if (!mounted || isLoading) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // User is not authenticated - will redirect
  if (!isAuthenticated) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-svh">
        <DashboardHeader />
        <main className="flex-1 min-h-0 overflow-auto p-4 md:p-5 flex flex-col bg-slate-50/50">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
