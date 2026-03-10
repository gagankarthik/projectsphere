"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Bell, Search, Plus } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

function useBreadcrumbs() {
  const pathname = usePathname()
  const parts = pathname.split("/").filter(Boolean)

  const crumbs: { label: string; href: string }[] = []

  for (let i = 0; i < parts.length; i++) {
    const seg = parts[i]
    const href = "/" + parts.slice(0, i + 1).join("/")

    const isId = seg.length > 20 || /^[a-zA-Z0-9_-]{20,}$/.test(seg)

    if (seg === "workspaces") crumbs.push({ label: "Workspaces", href })
    else if (seg === "projects") crumbs.push({ label: "Projects", href })
    else if (seg === "tasks") crumbs.push({ label: "Tasks", href })
    else if (seg === "members") crumbs.push({ label: "Members", href })
    else if (seg === "settings") crumbs.push({ label: "Settings", href })
    else if (seg === "new") crumbs.push({ label: "New", href })
    else if (seg === "board") crumbs.push({ label: "Board", href })
    else if (seg === "list") crumbs.push({ label: "List", href })
    else if (!isId) crumbs.push({ label: seg.charAt(0).toUpperCase() + seg.slice(1), href })
  }

  if (crumbs.length === 0) crumbs.push({ label: "Home", href: "/" })

  // On mobile, only show last 2 crumbs
  return crumbs
}

export function DashboardHeader() {
  const crumbs = useBreadcrumbs()
  // Show last 2 on small screens, all on larger
  const mobileCrumbs = crumbs.slice(-2)

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 sm:gap-3 border-b bg-background/95 px-3 sm:px-4 backdrop-blur-sm">
      {/* Sidebar toggle */}
      <SidebarTrigger className="-ml-1 shrink-0" />
      <Separator orientation="vertical" className="h-5 shrink-0" />

      {/* Breadcrumb — mobile shows last 2, desktop shows all */}
      <Breadcrumb className="min-w-0 flex-1 sm:flex-none">
        <BreadcrumbList className="flex-nowrap">
          {/* Mobile: last 2 crumbs */}
          <span className="sm:hidden flex items-center gap-1 min-w-0">
            {mobileCrumbs.map((crumb, i) => (
              <BreadcrumbItem key={crumb.href} className="min-w-0">
                {i < mobileCrumbs.length - 1 ? (
                  <>
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href} className="text-xs text-muted-foreground hover:text-foreground truncate max-w-[80px]">
                        {crumb.label}
                      </Link>
                    </BreadcrumbLink>
                    <BreadcrumbSeparator />
                  </>
                ) : (
                  <BreadcrumbPage className="text-xs font-medium truncate max-w-[100px]">{crumb.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            ))}
          </span>

          {/* Desktop: all crumbs */}
          <span className="hidden sm:flex items-center gap-1">
            {crumbs.map((crumb, i) => (
              <BreadcrumbItem key={crumb.href}>
                {i < crumbs.length - 1 ? (
                  <>
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href} className="text-sm text-muted-foreground hover:text-foreground">
                        {crumb.label}
                      </Link>
                    </BreadcrumbLink>
                    <BreadcrumbSeparator />
                  </>
                ) : (
                  <BreadcrumbPage className="text-sm font-medium">{crumb.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            ))}
          </span>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Search — desktop only */}
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search tasks…"
            className="h-8 w-44 pl-8 text-sm bg-muted/50 border-transparent focus:border-input focus:bg-background focus:w-60 transition-all duration-200"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-8 w-8 shrink-0">
          <Bell className="size-4" />
          <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 text-[9px] flex items-center justify-center bg-primary">
            3
          </Badge>
        </Button>

        {/* Quick create */}
        <Button size="sm" className="h-8 gap-1.5 shadow-sm shadow-primary/20 shrink-0">
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">New Task</span>
        </Button>
      </div>
    </header>
  )
}
