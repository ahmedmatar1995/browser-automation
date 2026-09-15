import { Button } from '@/components/ui/button'
import { runHelloWorldTrigger } from '@/features/workflows/actions'
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
  const runTrigger = useMutation({
    mutationFn: async () => await runHelloWorldTrigger(),
    onSuccess: (handle) => {
      toast.success('Trigger Running')
      setHandle({
        id: handle.id,
        accessToken: handle.publicAccessToken,
      })
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'something went wrong',
      )
    },
  })
  return (
    <div className="p-4">
      <Button
        size="sm"
        variant="outline"
        disabled={runTrigger.isPending}
        onClick={() => runTrigger.mutate()}
      >
        <Play className="size-4 text-muted-foreground" />
        Run
      </Button>
      <div className="mt-2 flex items-center justify-center text-white">
        {handle?.id && handle.accessToken && (
          <RunStatus id={handle.id} accessToken={handle.accessToken} />
        )}
      </div>
    </div>
  )
}
