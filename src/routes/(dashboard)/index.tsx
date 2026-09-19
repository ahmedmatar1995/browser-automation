import { Button } from '@/components/ui/button'

import { checkOrg, checkUser } from '@/lib/check-auth'
import { useMutation } from '@tanstack/react-query'

import { createFileRoute } from '@tanstack/react-router'
import { Play } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useRealtimeRun } from '@trigger.dev/react-hooks'

export const Route = createFileRoute('/(dashboard)/')({
  component: Home,
  beforeLoad: async () => await checkUser(),
  loader: async () => await checkOrg(),
})

function RunStatus({ id, accessToken }: { id: string; accessToken: string }) {
  const { run } = useRealtimeRun(id, {
    accessToken,
  })
  return <p>{run?.status}</p>
}

function Home() {
  const [handle, setHandle] = useState<{
    id: string
    accessToken: string
  } | null>(null)

  return (
    <div className="p-4">
      <Button size="sm" variant="outline">
        <Play className="size-4 text-muted-foreground" />
        Run
      </Button>
    </div>
  )
}
