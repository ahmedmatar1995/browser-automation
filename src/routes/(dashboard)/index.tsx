import { ThemeToggle } from '@/components/theme-toggle'
import { checkOrg, checkUser } from '@/lib/check-auth'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(dashboard)/')({
  component: Home,
  beforeLoad: async () => await checkUser(),
  loader: async () => await checkOrg(),
})

function Home() {
  return (
    <div className="p-4">
      <p>home page</p>
      <ThemeToggle />
    </div>
  )
}
