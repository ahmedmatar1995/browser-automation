import { checkOrg, checkUser } from '@/lib/check-auth'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'

export const Route = createFileRoute('/(dashboard)')({
  component: RouteComponent,
  beforeLoad: async () => await checkUser(),
  loader: async () => await checkOrg(),
})

function RouteComponent() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
