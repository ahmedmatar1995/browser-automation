import { checkOrg, checkUser } from '@/lib/check-auth'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { listWorkflowsAction } from '@/features/workflows/actions'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/(dashboard)')({
  component: RouteComponent,
  beforeLoad: async () => await checkUser(),
  loader: async () => {
    const { userId, orgId } = await checkOrg()
    const workflows = await listWorkflowsAction()
    return { userId, orgId, workflows }
  },
  errorComponent: ({ error, reset }) => {
    const isError = error instanceof Error
    const title = isError ? error.name : 'Error'
    const message = isError ? error.message : 'Something went wrong'
    const handleRetry = () => {
      if (typeof reset === 'function') reset()
      else window.location.reload()
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-24 right-[12%] size-[420px] rounded-full bg-(--hero-a) blur-3xl" />
          <div className="absolute -bottom-32 left-[8%] size-[520px] rounded-full bg-(--hero-b) blur-3xl" />
        </div>

        <div className="w-full max-w-lg rounded-2xl border bg-card p-8 shadow-xl">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/15">
              <AlertCircle className="size-6" />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                {title}
              </p>
              <h2 className="text-xl font-semibold leading-tight tracking-tight">
                Something went wrong
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We couldn&apos;t load your workspace. Please try again or return
                home.
              </p>
            </div>

            <div className="w-full rounded-xl border bg-muted px-4 py-3 text-left">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Details
              </p>
              <p className="wrap-break-word whitespace-pre-wrap text-sm leading-relaxed">
                {message}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
              <Button onClick={handleRetry} className="w-full sm:w-auto">
                Try again
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = '/')}
                className="w-full sm:w-auto"
              >
                Go home
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  },
})

function RouteComponent() {
  const { workflows } = Route.useLoaderData()
  return (
    <SidebarProvider>
      <AppSidebar workflows={workflows} />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
