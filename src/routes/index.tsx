import { Button } from '@/components/ui/button'
import { checkOrg, checkUser } from '@/lib/check-auth'
import { UserButton } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
  beforeLoad: async () => await checkUser(),
  loader: async () => await checkOrg(),
})

function Home() {
  const { userId, orgId } = Route.useLoaderData()
  return (
    <div>
      <p>home page</p>
      <Button>click me</Button>
      <UserButton />
      <div className="flex flex-col items-center justify-center m-4">
        <p className="text-md tracking-tight">{JSON.stringify(userId)}</p>
        <p className="text-md tracking-tight">{JSON.stringify(orgId)}</p>
      </div>
    </div>
  )
}
