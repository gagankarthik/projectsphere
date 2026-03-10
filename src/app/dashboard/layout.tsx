"use client"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-svh">
        <DashboardHeader />
        <main className="flex-1 min-h-0 overflow-auto p-4 md:p-6 flex flex-col">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
